# Generates docs/images/social-preview.png (1280x640) used as the repository
# social preview and as the Open Graph image for the documentation site.
#
# Usage: powershell -ExecutionPolicy Bypass -File scripts/generate-social-preview.ps1
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$repo = Split-Path -Parent $PSScriptRoot
$out = Join-Path $repo 'docs\images\social-preview.png'
$logoPath = Join-Path $repo 'logo.png'
$shotPath = Join-Path $repo 'docs\images\shots\dashboard.png'

$w = 1280
$h = 640
$bmp = New-Object System.Drawing.Bitmap($w, $h)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

$bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  (New-Object System.Drawing.Rectangle(0, 0, $w, $h)),
  [System.Drawing.Color]::FromArgb(6, 10, 20),
  [System.Drawing.Color]::FromArgb(12, 22, 40), 45)
$g.FillRectangle($bg, 0, 0, $w, $h)
$bg.Dispose()

function Add-Glow([int]$x, [int]$y, [int]$size, [int]$r, [int]$gr, [int]$b, [int]$alpha) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddEllipse($x, $y, $size, $size)
  $brush = New-Object System.Drawing.Drawing2D.PathGradientBrush($path)
  $brush.CenterColor = [System.Drawing.Color]::FromArgb($alpha, $r, $gr, $b)
  $brush.SurroundColors = @([System.Drawing.Color]::FromArgb(0, $r, $gr, $b))
  $g.FillPath($brush, $path)
  $brush.Dispose()
  $path.Dispose()
}

Add-Glow -x -260 -y -300 -size 900 -r 37 -gr 99 -b 235 -alpha 90
Add-Glow -x 820 -y 260 -size 760 -r 239 -gr 68 -b 68 -alpha 70

if (Test-Path $logoPath) {
  $logo = [System.Drawing.Image]::FromFile($logoPath)
  $g.DrawImage($logo, 84, 84, 120, 120)
  $logo.Dispose()
}

function New-RoundedPath([int]$x, [int]$y, [int]$width, [int]$height, [int]$radius) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $radius * 2
  $p.AddArc($x, $y, $d, $d, 180, 90)
  $p.AddArc(($x + $width - $d), $y, $d, $d, 270, 90)
  $p.AddArc(($x + $width - $d), ($y + $height - $d), $d, $d, 0, 90)
  $p.AddArc($x, ($y + $height - $d), $d, $d, 90, 90)
  $p.CloseFigure()
  return $p
}

if (Test-Path $shotPath) {
  $shot = [System.Drawing.Image]::FromFile($shotPath)
  $shotW = 540
  $shotH = 338
  $shotX = 680
  $shotY = 132
  $frame = New-RoundedPath $shotX $shotY $shotW $shotH 18
  $g.SetClip($frame)
  $g.DrawImage($shot, $shotX, $shotY, $shotW, $shotH)
  $g.ResetClip()
  $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(70, 120, 200), 2)
  $g.DrawPath($pen, $frame)
  $pen.Dispose()
  $frame.Dispose()
  $shot.Dispose()
}

$white = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(238, 244, 255))
$muted = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(169, 184, 208))
$dim = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(125, 140, 165))

$titleFont = New-Object System.Drawing.Font('Segoe UI', 62, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$subFont = New-Object System.Drawing.Font('Segoe UI', 27, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$chipFont = New-Object System.Drawing.Font('Segoe UI', 19, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$smallFont = New-Object System.Drawing.Font('Segoe UI', 18, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)

$g.DrawString('MyLocalDev', $titleFont, $white, 84, 250)
$g.DrawString('Versioned PHP, Node and database runtimes', $subFont, $muted, 88, 348)
$g.DrawString('on one machine - no Docker, no conflicts.', $subFont, $muted, 88, 388)

$chipY = 500
$chipX = 88
foreach ($text in @('PHP 7.4 - 8.5', 'Node 16 - 24', '17 managed runtimes')) {
  $chipW = [int]$g.MeasureString($text, $chipFont).Width + 34
  $rect = New-Object System.Drawing.Rectangle($chipX, $chipY, $chipW, 42)
  $fill = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(22, 42, 74))
  $border = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(60, 110, 180), 1)
  $g.FillRectangle($fill, $rect)
  $g.DrawRectangle($border, $rect)
  $g.DrawString($text, $chipFont, $white, ($chipX + 16), ($chipY + 9))
  $fill.Dispose()
  $border.Dispose()
  $chipX += $chipW + 14
}

$barRect = New-Object System.Drawing.Rectangle(0, ($h - 10), $w, 10)
$bar = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  $barRect,
  [System.Drawing.Color]::FromArgb(59, 130, 246),
  [System.Drawing.Color]::FromArgb(239, 68, 68), 0)
$g.FillRectangle($bar, $barRect)
$bar.Dispose()

$g.DrawString('playpixelpro.github.io/mylocaldev', $smallFont, $dim, 160, 590)

$titleFont.Dispose(); $subFont.Dispose(); $chipFont.Dispose(); $smallFont.Dispose()
$white.Dispose(); $muted.Dispose(); $dim.Dispose()
$g.Dispose()
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

Write-Output ("Generated {0}" -f $out)
