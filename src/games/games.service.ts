import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';

@Injectable()
export class GamesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async findAll(accessLevel: number, role?: string) {
    const games = await this.prisma.game.findMany();

    if (role === 'admin') {
      return games;
    }

    return games.map((game: { accessLevel: number }) => {
      if (game.accessLevel > accessLevel) {
        return { ...game, fileUrl: null, fileName: null };
      }
      return game;
    });
  }

  async findOne(id: number, accessLevel: number, role?: string) {
    const game = await this.prisma.game.findUnique({ where: { id } });

    if (!game) {
      throw new NotFoundException('Jogo não encontrado.');
    }

    if (role !== 'admin' && game.accessLevel > accessLevel) {
      throw new ForbiddenException('Seu plano não permite acesso a este jogo.');
    }

    return game;
  }

  async create(dto: CreateGameDto) {
    try {
      return await this.prisma.game.create({
        data: {
          title: dto.title,
          console: dto.platform,
          image: dto.coverUrl ?? '',
          accessLevel: dto.accessLevel,
          planId: dto.planId || null,
        },
      });
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Erro ao criar jogo.');
    }
  }

  async update(id: number, dto: UpdateGameDto) {
    const data: {
      title?: string;
      console?: string;
      image?: string;
      accessLevel?: number;
      planId?: number | null;
    } = {};

    if (dto.title !== undefined) data.title = dto.title;
    if (dto.platform !== undefined) data.console = dto.platform;
    if (dto.coverUrl) data.image = dto.coverUrl;
    if (dto.accessLevel != null) data.accessLevel = dto.accessLevel;
    if (dto.planId !== undefined) data.planId = dto.planId || null;

    try {
      return await this.prisma.game.update({ where: { id }, data });
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Erro ao atualizar jogo.');
    }
  }

  async remove(id: number) {
    try {
      await this.prisma.game.delete({ where: { id } });
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Erro ao deletar jogo.');
    }
  }

  async updateImage(id: number, file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Nenhuma imagem enviada.');
    }

    try {
      const result = await this.cloudinary.uploadFromBuffer(file.buffer, 'archv-rooms/games', 'image');
      return await this.prisma.game.update({
        where: { id },
        data: { image: result.secure_url },
      });
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Erro ao atualizar imagem do jogo.');
    }
  }

  async updateFile(id: number, file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }

    try {
      const result = await this.cloudinary.uploadFromBuffer(file.buffer, 'archv-rooms/files', 'raw');
      return await this.prisma.game.update({
        where: { id },
        data: { fileUrl: result.secure_url },
      });
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Erro ao atualizar arquivo da room.');
    }
  }
}
