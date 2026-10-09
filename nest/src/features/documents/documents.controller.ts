import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DocumentsService } from './documents.service';

@UseGuards(AuthGuard('jwt'))
@Controller()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  getDocuments() {
    return this.documentsService.getDocuments();
  }
}
