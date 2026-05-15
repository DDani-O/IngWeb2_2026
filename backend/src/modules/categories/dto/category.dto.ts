export class CategoryDto {
  id: string;
  nombre: string;
  icono: string;
  cliente_id: string | null;
  categoria_sistema: boolean;
  is_global: boolean;

  constructor(data: {
    id: string;
    nombre: string;
    icono: string;
    cliente_id: string | null;
    categoria_sistema: boolean;
  }) {
    this.id = data.id;
    this.nombre = data.nombre;
    this.icono = data.icono;
    this.cliente_id = data.cliente_id;
    this.categoria_sistema = data.categoria_sistema;
    this.is_global = !data.cliente_id; // Categoría global si cliente_id es null
  }
}
