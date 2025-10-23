import { Controller, Post, Get, Body, Param, Request, UseGuards } from '@nestjs/common';
import { VariablesDependientesService } from './variables-dependientes.service';
import { CrearVariableDto } from '../../dtos/variable-dependiente.dto'; // ✅ nombre correcto
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('variables-dependientes')
export class VariablesDependientesController {
  constructor(private readonly variablesService: VariablesDependientesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  crear(@Body() crearVariableDto: CrearVariableDto, @Request() req: any) { // ✅ usar CrearVariableDto
    return this.variablesService.crear(crearVariableDto, req.user.id);
  }

  @Get('proyecto/:idProyecto')
  @UseGuards(JwtAuthGuard)
  encontrarPorProyecto(@Param('idProyecto') idProyecto: string, @Request() req: any) {
    return this.variablesService.encontrarPorProyecto(+idProyecto, req.user.id);
  }
}
