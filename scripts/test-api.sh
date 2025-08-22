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

# --- PRUEBA 1: Crear una cita para Perú (PE) y capturar la respuesta ---
print_separator
echo "Prueba 1: Creando una nueva cita para el asegurado 01234 (Perú)..."
CREATE_RESPONSE=$(curl -s -X POST \
  "${API_URL}/appointments" \
  -H 'Content-Type: application/json' \
  -d '{
    "insuredId": "01234",
    "scheduleId": 101,
    "countryISO": "PE"
  }')

echo "Respuesta de creación:"
echo $CREATE_RESPONSE

# Extraer datos de la respuesta para usarlos después
APPOINTMENT_ID=$(echo $CREATE_RESPONSE | jq -r '.appointmentId')
INSURED_ID=$(echo $CREATE_RESPONSE | jq -r '.insuredId')


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

# --- PRUEBA 5: Obtener la cita específica creada en la Prueba 1 ---
if [ -n "$APPOINTMENT_ID" ] && [ -n "$INSURED_ID" ]; then
  print_separator
  echo "Prueba 5: Obteniendo la cita específica con ID $APPOINTMENT_ID para el asegurado $INSURED_ID..."
  curl "${API_URL}/appointments/${INSURED_ID}/${APPOINTMENT_ID}"
else
  echo "No se pudo obtener el ID de la cita o del asegurado de la Prueba 1. Omitiendo la Prueba 5."
fi


print_separator
echo "Pruebas finalizadas."
