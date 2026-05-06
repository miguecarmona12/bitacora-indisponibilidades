$ErrorActionPreference = "Stop"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "INICIANDO SISTEMA AUTOMATICO: BITACORA MVP (LOCAL WIN)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$RootDir = (Get-Location).Path

# --------------------------------------------------------
# 1. BACKEND
# --------------------------------------------------------
Write-Host "`nPaso 1: Backend..." -ForegroundColor Yellow
Set-Location "$RootDir\backend"

$PythonCmd = "python"

if (-Not (Get-Command $PythonCmd -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Python no esta instalado o no esta en el PATH." -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Usando Python: $PythonCmd" -ForegroundColor Green

if (-Not (Test-Path "venv")) {
    Write-Host "[*] Creando entorno virtual..." -ForegroundColor Cyan
    & $PythonCmd -m venv venv
}

Write-Host "[*] Instalando dependencias backend..." -ForegroundColor Cyan
& "$RootDir\backend\venv\Scripts\python.exe" -m pip install -r requirements.txt

$env:DATABASE_URL = "postgresql://postgres:M0n1t0r30**ux@localhost:5432/bitacora"

Write-Host "[*] Iniciando Backend en http://localhost:8000" -ForegroundColor Green
Start-Process -FilePath "$RootDir\backend\venv\Scripts\uvicorn.exe" -ArgumentList "main:app", "--reload", "--host", "0.0.0.0", "--port", "8000" -NoNewWindow -PassThru -RedirectStandardOutput "$RootDir\backend\backend_log.txt" -RedirectStandardError "$RootDir\backend\backend_err.txt" | Set-Variable -Name BackendProcess

Set-Location $RootDir

# --------------------------------------------------------
# 2. FRONTEND
# --------------------------------------------------------
Write-Host "`nPaso 2: Frontend..." -ForegroundColor Yellow
Set-Location "$RootDir\frontend"

if (-Not (Get-Command "npm" -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js/npm no esta instalado o no esta en el PATH." -ForegroundColor Red
    Stop-Process -Id $BackendProcess.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

$NodeVersion = node -v
Write-Host "[OK] Node detectado: $NodeVersion" -ForegroundColor Green

if (-Not (Test-Path "node_modules")) {
    Write-Host "[*] Instalando dependencias frontend..." -ForegroundColor Cyan
    npm install
}

$env:VITE_API_URL = "http://localhost:8000"

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "[OK] SISTEMA LISTO Y CORRIENDO" -ForegroundColor Green
Write-Host "-> Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "-> Backend: http://localhost:8000" -ForegroundColor Green
Write-Host "-> Logs Backend: backend_log.txt y backend_err.txt" -ForegroundColor Yellow
Write-Host "-> Presiona Ctrl + C para detener la ejecucion y el Backend" -ForegroundColor Yellow
Write-Host "========================================================`n" -ForegroundColor Cyan

try {
    npm run dev
}
finally {
    # --------------------------------------------------------
    # 3. SHUTDOWN
    # --------------------------------------------------------
    Write-Host "`nApagando sistema..." -ForegroundColor Yellow
    if ($BackendProcess) {
        Stop-Process -Id $BackendProcess.Id -Force -ErrorAction SilentlyContinue
        Write-Host "[OK] Backend detenido" -ForegroundColor Green
    }
}
