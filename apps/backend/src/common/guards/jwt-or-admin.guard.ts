import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtOrAdminGuard extends AuthGuard(['jwt', 'admin-jwt']) { }
