import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser, JwtAuthGuard, JwtPayload } from "../../common/auth";
import { UpdateProfileDto } from "../users/dto/update-profile.dto";
import { UsersService } from "../users/users.service";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

/** Autenticación y perfil propio (contrato §3.1, backend/README.md). */
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  /** POST /auth/register: crea la cuenta y devuelve `{ token, usuario }` (201). */
  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /** POST /auth/login: `{ token, usuario }` (200); 401 `CREDENCIALES_INVALIDAS`. */
  @Post("login")
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  /** GET /auth/me: el `usuario` de la sesión, con su perfil de gasto vigente si es cliente. */
  @Get("me")
  me(@CurrentUser() user: JwtPayload) {
    return this.authService.me(user);
  }

  @UseGuards(JwtAuthGuard)
  /** PUT /auth/profile: edita el perfil propio; los campos permitidos dependen del rol. */
  @Put("profile")
  updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user, dto);
  }
}
