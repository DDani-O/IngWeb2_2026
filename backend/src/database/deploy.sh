#!/bin/bash

# =========================================================
# Script de Deployment - Base de Datos Supabase
# =========================================================
# Simplifica el deploy del archivo init_schema.sql

DB_FOLDER="$(dirname "$0")"
INIT_SCHEMA="$DB_FOLDER/migrations/0001_init_schema.sql"

echo "🚀 Deploy Base de Datos - Gestión de Gastos"
echo "============================================"
echo ""

# Opción 1: Mostrar instrucciones
if [ "$1" = "--help" ] || [ "$1" = "-h" ] || [ -z "$1" ]; then
    echo "📋 Guía Rápida de Deploy:"
    echo ""
    echo "1. Abrir Supabase → SQL Editor"
    echo "2. Copiar contenido de:"
    echo "   $INIT_SCHEMA"
    echo "3. Pegar y ejecutar"
    echo ""
    echo "Comandos:"
    echo "  show      Mostrar contenido del archivo init_schema.sql"
    echo "  path      Mostrar ruta completa del archivo"
    echo "  --help    Ver esta ayuda"
    exit 0
fi

# Opción 2: Mostrar contenido
if [ "$1" = "show" ]; then
    if [ -f "$INIT_SCHEMA" ]; then
        cat "$INIT_SCHEMA"
    else
        echo "❌ Error: No encontrado $INIT_SCHEMA"
        exit 1
    fi
    exit 0
fi

# Opción 3: Mostrar ruta
if [ "$1" = "path" ]; then
    echo "$INIT_SCHEMA"
    exit 0
fi

# Por defecto
echo "✅ Para deployar la BD:"
echo ""
echo "  1. Abre Supabase SQL Editor"
echo "  2. Copia este archivo:"
echo "     $INIT_SCHEMA"
echo "  3. Pega y ejecuta"
echo ""
echo "Más info: ./deploy.sh --help"
