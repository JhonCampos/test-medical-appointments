#!/bin/bash

# Script para probar los endpoints de la API de citas médicas.
# Uso: ./scripts/test-api.sh <URL_BASE_DE_LA_API>

# 1. Validar que se haya proporcionado la URL como argumento
if [ -z "$1" ]; then
  echo "Error: No se proporcionó la URL base de la API."
  echo "Uso: $0 https://xxxxxxxxxx.execute-api.us-east-2.amazonaws.com"
  exit 1
fi

API_URL=$1

# Imprimir un separador para mayor claridad
function print_separator() {
  echo "
======================================================================
"
}

# --- PRUEBA 1: Crear una cita para Perú (PE) ---
print_separator
echo "Prueba 1: Creando una nueva cita para el asegurado 01234 (Perú)..."
curl -X POST \
  "${API_URL}/appointments" \
  -H 'Content-Type: application/json' \
  -d '{
    "insuredId": "01234",
    "scheduleId": 101,
    "countryISO": "PE"
  }'

# --- PRUEBA 2: Crear una cita para Chile (CL) ---
print_separator
echo "Prueba 2: Creando una nueva cita para el asegurado 56789 (Chile)..."
curl -X POST \
  "${API_URL}/appointments" \
  -H 'Content-Type: application/json' \
  -d '{
    "insuredId": "56789",
    "scheduleId": 202,
    "countryISO": "CL"
  }'

# --- PRUEBA 3: Obtener las citas del asegurado de Perú ---
print_separator
echo "Prueba 3: Obteniendo las citas para el asegurado 01234..."
curl "${API_URL}/appointments/01234"

# --- PRUEBA 4: Obtener las citas del asegurado de Chile ---
print_separator
echo "Prueba 4: Obteniendo las citas para el asegurado 56789..."
curl "${API_URL}/appointments/56789"

print_separator
echo "Pruebas finalizadas."
