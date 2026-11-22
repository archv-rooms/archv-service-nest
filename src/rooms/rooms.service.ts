import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { RoomsRuntimeService } from './rooms-runtime.service';
import { CreateRoomDto } from './dto/create-room.dto';

const userSelect = { id: true, name: true, username: true, avatar: true };

const roomInclude = {
  game: { select: { id: true, title: true, console: true, image: true, fileUrl: true } },
  host: { select: userSelect },
  members: { include: { user: { select: userSelect } } },
};

interface RoomUser {
  id: number;
  name: string;
  username: string | null;
  avatar: string | null;
}

interface RoomWithRelations {
  id: number;
  gameId: number;
  hostId: number;
  maxPlayers: number;
  status: string;
  createdAt: Date;
  game: { id: number; title: string; console: string; image: string; fileUrl: string | null };
  host: RoomUser;
  members: { userId: number; user: RoomUser }[];
}

function serialize(room: RoomWithRelations, userId: number) {
  return {
    id: room.id,
    gameId: room.gameId,
    game: room.game.title,
    console: room.game.console,
    image: room.game.image,
    fileUrl: room.game.fileUrl,
    host: room.host.username || room.host.name,
    hostId: room.hostId,
    isHost: room.hostId === userId,
    players: room.members.length,
    maxPlayers: room.maxPlayers,
    joined: room.members.some((member) => member.userId === userId),
    members: room.members.map((member) => member.user),
    createdAt: room.createdAt,
  };
}

@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly runtime: RoomsRuntimeService,
    private readonly realtime: RealtimeGateway,
    private readonly push: PushService,
  ) {}

  async list(userId: number) {
    const rooms: RoomWithRelations[] = await this.prisma.room.findMany({
      where: { status: 'open' },
      include: roomInclude,
      orderBy: { createdAt: 'desc' },
    });

    return { rooms: rooms.map((room) => serialize(room, userId)) };
  }

  async create(userId: number, dto: CreateRoomDto) {
    const gameId = Number(dto.gameId);
    const maxPlayers = Math.min(4, Math.max(2, Number(dto.maxPlayers) || 2));

    if (!gameId) {
      throw new BadRequestException('gameId é obrigatório.');
    }

    const game = await this.prisma.game.findUnique({ where: { id: gameId } });
    if (!game) {
      throw new NotFoundException('Jogo não encontrado.');
    }

    const room: RoomWithRelations = await this.prisma.room.create({
      data: {
        gameId,
        hostId: userId,
        maxPlayers,
        members: { create: [{ userId }] },
      },
      include: roomInclude,
    });

    this.runtime.touch(room.id);
    this.realtime.emitRoomsUpdated();

    return { room: serialize(room, userId) };
  }

  async join(userId: number, roomId: number) {
    const room = await this.findRoom(roomId);
    if (!room || room.status !== 'open') {
      throw new NotFoundException('Sala não encontrada.');
    }

    let newlyJoined = false;
    if (!room.members.some((member) => member.userId === userId)) {
      if (room.members.length >= room.maxPlayers) {
        throw new ConflictException('Sala cheia.');
      }
      await this.prisma.roomMember.create({ data: { roomId, userId } });
      newlyJoined = true;
    }

    const updated = await this.findRoom(roomId);
    if (!updated) {
      throw new NotFoundException('Sala não encontrada.');
    }

    this.runtime.touch(roomId);
    this.realtime.emitRoomsUpdated();

    if (newlyJoined && updated.members.length >= updated.maxPlayers) {
      this.push.sendPush(
        updated.members.map((member) => member.userId),
        'Sala cheia!',
        `A sala de ${updated.game.title} está completa. Hora de jogar!`,
        { type: 'room_full', roomId: updated.id },
      );
    }

    return { room: serialize(updated, userId) };
  }

  async leave(userId: number, roomId: number) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      this.runtime.delete(roomId);
      return { closed: true };
    }

    if (room.hostId === userId) {
      await this.prisma.room.delete({ where: { id: roomId } });
      this.runtime.delete(roomId);
      this.realtime.emitRoomsUpdated();
      return { closed: true };
    }

    await this.prisma.roomMember.deleteMany({ where: { roomId, userId } });
    this.runtime.touch(roomId).ready.delete(userId);
    this.realtime.emitRoomsUpdated();

    return { closed: false };
  }

  async getState(userId: number, roomId: number) {
    const room = await this.loadMemberRoom(userId, roomId);
    this.runtime.touch(room.id);
    return this.statePayload(room, userId);
  }

  async setReady(userId: number, roomId: number, ready?: boolean) {
    const room = await this.loadMemberRoom(userId, roomId);
    const runtime = this.runtime.touch(room.id);

    if (ready) runtime.ready.add(userId);
    else runtime.ready.delete(userId);

    return this.statePayload(room, userId);
  }

  async sendMessage(userId: number, roomId: number, rawContent?: string) {
    const room = await this.loadMemberRoom(userId, roomId);

    const content = String(rawContent || '').trim().slice(0, 300);
    if (!content) {
      throw new BadRequestException('Mensagem vazia.');
    }

    const sender = room.members.find((member) => member.userId === userId)!.user;
    const runtime = this.runtime.touch(room.id);

    runtime.messages.push({
      id: runtime.nextId++,
      userId: sender.id,
      from: sender.username || sender.name,
      text: content,
      createdAt: new Date().toISOString(),
    });
    if (runtime.messages.length > 50) runtime.messages.shift();

    return this.statePayload(room, userId);
  }

  async start(userId: number, roomId: number) {
    const room = await this.loadMemberRoom(userId, roomId);

    if (room.hostId !== userId) {
      throw new ForbiddenException('Só o dono pode iniciar.');
    }

    const runtime = this.runtime.touch(room.id);
    const others = room.members.filter((member) => member.userId !== room.hostId);

    if (others.length < 1) {
      throw new BadRequestException('Aguarde outro jogador entrar.');
    }
    if (!others.every((member) => runtime.ready.has(member.userId))) {
      throw new BadRequestException('Nem todos estão prontos.');
    }

    runtime.startedAt = Date.now();
    runtime.ready.clear();

    return this.statePayload(room, userId);
  }

  private findRoom(roomId: number): Promise<RoomWithRelations | null> {
    return this.prisma.room.findUnique({ where: { id: roomId }, include: roomInclude });
  }

  private async loadMemberRoom(userId: number, roomId: number) {
    const room = await this.findRoom(roomId);
    if (!room) {
      throw new NotFoundException('Sala não encontrada.');
    }
    if (!room.members.some((member) => member.userId === userId)) {
      throw new ForbiddenException('Você não está nesta sala.');
    }
    return room;
  }

  private statePayload(room: RoomWithRelations, userId: number) {
    const runtime = this.runtime.get(room.id);
    return {
      room: serialize(room, userId),
      me: userId,
      ready: [...runtime.ready],
      startedAt: runtime.startedAt,
      messages: runtime.messages,
    };
  }
}
