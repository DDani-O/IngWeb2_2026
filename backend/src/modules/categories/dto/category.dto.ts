export class CategoryDto {
  id: string;
  nombre: string;
  icono: string;
  descripcion: string | null;

  constructor(data: {
    id: string;
    nombre: string;
    icono: string;
    descripcion: string | null;
  }) {
    this.id = data.id;
    this.nombre = data.nombre;
    this.icono = data.icono;
    this.descripcion = data.descripcion;
  }
}
