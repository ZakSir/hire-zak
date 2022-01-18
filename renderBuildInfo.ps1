[CmdletBinding()]
Param(
	[Parameter(Mandatory = $true)]
	[string]$OutputPath,
	
	[Parameter(Mandatory = $true)]
	[string]$RepositoryUri,
	
	[Parameter(Mandatory = $true)]
	[string]$SourceBranch,
	
	[Parameter(Mandatory = $true)]
	[string]$SourceBranchName,
	
	[Parameter(Mandatory = $true)]
	[string]$Commit
)

$properties = @{
	"commitId" = $Commit;
	"commitUri" = "https://github.com/ZakSir/HireZak/commit/$Commit";
	"repositoryUri" = $RespositoryUri;
	"fullBranchName" = $SourceBranch;
	"branchName" = $SourceBranchName;
}

$properties | ConvertTo-Json -Depth 100 | Out-File -FilePath $OutputPath;

