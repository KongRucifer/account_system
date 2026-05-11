import { Injectable } from '@nestjs/common';

@Injectable()
export class PermissionsService {
  // Stub implementation - Permission model doesn't exist in new schema
  // New schema uses SystemRole-based permissions instead

  findAll() {
    return [];
  }

  async findOne(id: number) {
    return null;
  }
}
