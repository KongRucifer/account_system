import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService, TokenResponse } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('1. Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login — returns JWT access token, refresh token and user profile (tokens in cookies)' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TokenResponse> { // clients is now an array in TokenResponse
    const ipAddress = this.getClientIp(req);
    const result = await this.authService.login(loginDto, ipAddress);
    
    // Set tokens in HTTP-only cookies
    this.setTokenCookies(res, result.accessToken, result.refreshToken, result.expiresIn);
    
    return result;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh tokens — get new access token using refresh token from cookie' })
  @ApiResponse({ status: 200, description: 'Token refresh successful' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TokenResponse> {
    const ipAddress = this.getClientIp(req);
    const refreshToken = req.cookies?.refresh_token;
    
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found in cookies');
    }
    
    const result = await this.authService.refresh(
      { refreshToken },
      ipAddress,
    );
    
    // Set new tokens in HTTP-only cookies
    this.setTokenCookies(res, result.accessToken, result.refreshToken, result.expiresIn);
    
    return result;
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register — create new client account' })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  @ApiResponse({ status: 400, description: 'Invalid input or validation failed' })
  @ApiResponse({ status: 409, description: 'Account already exists' })
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<{ message: string; clientId?: string }> {
    return this.authService.register(registerDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password — update password using phone number' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Phone number not found or account not found' })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.resetPassword(resetPasswordDto.phoneNumber, resetPasswordDto.newPassword);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout — revoke refresh token and clear cookies' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const refreshToken = req.cookies?.refresh_token;
    
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }
    
    // Clear cookies
    this.clearTokenCookies(res);
    
    return { message: 'Logged out successfully' };
  }

  private setTokenCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
    expiresIn: number,
  ): void {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Access Token cookie (15 minutes)
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProduction, // true in production (HTTPS)
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: expiresIn * 1000, // milliseconds
      path: '/',
    });
    
    // Refresh Token cookie (7 days)
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      path: '/auth/refresh', // Only sent to refresh endpoint
    });
  }

  private clearTokenCookies(res: Response): void {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/auth/refresh' });
  }

  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = typeof forwarded === 'string' 
      ? forwarded.split(',')[0].trim() 
      : req.socket.remoteAddress;
    return ip || 'unknown';
  }
}
