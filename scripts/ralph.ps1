param([int]$Max = 30)

$raiz = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $raiz
$logs = Join-Path $raiz ".ralph"
New-Item -ItemType Directory -Force -Path $logs | Out-Null

$prompt = Get-Content (Join-Path $raiz "scripts\ralph-prompt.md") -Raw -Encoding UTF8
$semProgresso = 0
$inicio = Get-Date

for ($i = 1; $i -le $Max; $i++) {
  $antes = Get-Content (Join-Path $raiz "ORCHESTRATION.md") -Raw -Encoding UTF8
  if ($antes -match "ESTADO: CONCLUIDA") { Write-Host "Entrega concluída. Ver ORCHESTRATION.md."; break }
  if ($antes -match "ESTADO: BLOQUEADA") { Write-Host "Entrega bloqueada. Ver a seção Blockers do ORCHESTRATION.md."; break }

  $carimbo = Get-Date -Format "HH:mm:ss"
  $log = Join-Path $logs ("iteracao-{0:D2}.log" -f $i)
  Write-Host "=== Iteração $i de $Max ($carimbo) ==="

  & claude -p $prompt --dangerously-skip-permissions --output-format text | Tee-Object -FilePath $log

  $depois = Get-Content (Join-Path $raiz "ORCHESTRATION.md") -Raw -Encoding UTF8
  if ($depois -eq $antes) { $semProgresso++ } else { $semProgresso = 0 }
  if ($semProgresso -ge 2) { Write-Host "Duas iterações sem mudar o ORCHESTRATION.md. Parando pra não queimar tokens."; break }

  Start-Sleep -Seconds 5
}

$duracao = (Get-Date) - $inicio
Write-Host ("Fim do loop. Iterações: {0}. Tempo: {1:hh\:mm\:ss}. Logs em .ralph\." -f ($i - 1), $duracao)
Select-String -Path (Join-Path $raiz "ORCHESTRATION.md") -Pattern "^ESTADO:|^Progresso:" | ForEach-Object { $_.Line }
