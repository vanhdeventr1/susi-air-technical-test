import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  describe('documents', () => {
    it('should return documents from the service', () => {
      expect(appController.getDocuments()).toEqual(appService.getDocuments());
    });
  });

  describe('flight-hours', () => {
    it('should return flight hours from the service', () => {
      expect(appController.getFlightHours()).toEqual(
        appService.getFlightHours(),
      );
    });
  });

  describe('schedules', () => {
    it('should return schedules from the service', () => {
      expect(appController.getSchedules()).toEqual(appService.getSchedules());
    });
  });
});
