$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$Tools = Join-Path $Root ".tools"

$env:JAVA_HOME = Join-Path $Tools "jdk"
$env:Path = @(
    (Join-Path $Tools "node")
    (Join-Path $env:JAVA_HOME "bin")
    (Join-Path $Tools "gradle\bin")
    $env:Path
) -join ";"

Write-Output "MVMP local tools are ready."
Write-Output "JAVA_HOME=$env:JAVA_HOME"
node --version
npm --version
java -version
gradle --version
