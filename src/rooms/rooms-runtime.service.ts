import { Injectable } from '@nestjs/common';

export interface RoomMessage {
  id: number;
  userId: number;
  from: string | null;
  text: string;
  createdAt: string;
}

export interface RoomRuntime {
  ready: Set<number>;
  startedAt: number | null;
  messages: RoomMessage[];
  nextId: number;
  lastActivityAt: number;
}

@Injectable()
export class RoomsRuntimeService {
  private readonly rooms = new Map<number, RoomRuntime>();

  get(roomId: number): RoomRuntime {
    let runtime = this.rooms.get(roomId);
    if (!runtime) {
      runtime = {
        ready: new Set(),
        startedAt: null,
        messages: [],
        nextId: 1,
        lastActivityAt: Date.now(),
      };
      this.rooms.set(roomId, runtime);
    }
    return runtime;
  }

  touch(roomId: number): RoomRuntime {
    const runtime = this.get(roomId);
    runtime.lastActivityAt = Date.now();
    return runtime;
  }

  delete(roomId: number) {
    this.rooms.delete(roomId);
  }
}
