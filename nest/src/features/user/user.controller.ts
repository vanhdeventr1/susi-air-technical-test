import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { CurrentUser } from "src/cores/decorators/current-user.decorator";
import { JwtAuthGuard } from "src/cores/guards/jwt-auth.guard";
import { JoiValidationParamPipe } from "src/cores/validators/pipes/joi-validation-param.pipe";
import { JoiValidationPipe } from "src/cores/validators/pipes/joi-validation.pipe";
import { userIdParamSchema } from "../auth/validations/params/user-id.param";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { User } from "./entities/user.entity";
import { UserService } from "./user.service";
import { changePasswordSchema } from "./validations/requests/change-password.request";
import { updateUserSchema } from "./validations/requests/update-user.request";

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() query: any, @CurrentUser() user: User) {
    return this.userService.findAll(query, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get(":id")
  async findOne(
    @Param("id", new JoiValidationParamPipe(userIdParamSchema))
    user: User,
  ) {
    return this.userService.findOne(user);
  }

  @UseInterceptors(FileInterceptor("file"))
  @UseGuards(JwtAuthGuard)
  @Post(":id/image")
  async uploadProfilePhoto(
    @UploadedFile() file: Express.Multer.File,
    @Param("id", new JoiValidationParamPipe(userIdParamSchema)) user: User,
  ) {
    return this.userService.updatePhotoProfile(user, file);
  }

  @UseGuards(JwtAuthGuard)
  @Put("change-password")
  async changePassword(
    @Body(new JoiValidationPipe(changePasswordSchema))
    changePasswordDto: ChangePasswordDto,
    @CurrentUser() user: User,
  ) {
    return this.userService.changePassword(user, changePasswordDto);
  }

  @UseGuards(JwtAuthGuard)
  @Put()
  update(
    @Body(new JoiValidationParamPipe(updateUserSchema))
    updateUserDto: UpdateUserDto,
    @CurrentUser() user: User,
  ) {
    return this.userService.update(user, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  async remove(
    @Param("id", new JoiValidationParamPipe(userIdParamSchema))
    user: User,
  ) {
    return this.userService.remove(user);
  }
}
