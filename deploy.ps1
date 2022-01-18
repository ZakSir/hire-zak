[CmdletBinding()]
Param(
	[Parameter(Mandatory = $true)]
	[string]$DeploymentRootDirectory = $PSScriptRoot,

	[Parameter(Mandatory = $true)]
	[string]$StorageAccountName,

	[Parameter(Mandatory = $true)]
	[string]$ResourceGroupName,

	[Parameter(Mandatory = $true)]
	[string]$TargetContainerName,

	[Parameter(Mandatory = $true)]
	[string]$TargetSubscriptionId
)

Write-Verbose "`$DeploymentRootDirectory = '$($DeploymentRootDirectory)'";
Write-Verbose "`$StorageAccountName = '$($StorageAccountName)'";
Write-Verbose "`$ResourceGroupName = '$($ResourceGroupName)'";
Write-Verbose "`$TargetContainerName = '$($TargetContainerName)'";
Write-Verbose "`$TargetSubscriptionId = '$($TargetSubscriptionId)'";

function CreateBlobProperties {
	Param(
		[Parameter(Mandatory = $true)]
		[string]$SourceContentPath,

		[Parameter(Mandatory = $true)]
		[string]$BlobPath,

		[Parameter(Mandatory = $true)]
		[string]$ContainerName,
		
		[Parameter(Mandatory = $true)]
		[Microsoft.WindowsAzure.Commands.Common.Storage.LazyAzureStorageContext]$AccountContext,

		[Parameter()]
		[ValidateSet("Hot", "Cool", "Archive")]
		[string]$AccessTier = "Hot",

		[Parameter()]
		[string]$ContentType = $null
	)

	if($ContentType -eq $null)
	{
		$ct = [System.Web.MimeMapping]::GetMimeMapping($SourceContentPath);
	}
	else
	{
		$ct = $ContentType;
	}

	$blobSettings = @{
		"File" = $SourceContentPath;
		"Container" = $ContainerName;
		"Blob" = $BlobPath;
		"Context" = $AccountContext;
		"StandardBlobTier" = $AccessTier;
		"Properties" = @{
			"ContentType" = $ct;
		}
	}

	return $blobSettings;
}

function UploadBlob {
	Param(
		[Parameter(Mandatory = $true)]
		[string]$SourceContentPath,

		[Parameter(Mandatory = $true)]
		[string]$BlobPath,

		[Parameter(Mandatory = $true)]
		[string]$ContainerName,
		
		[Parameter(Mandatory = $true)]
		[Microsoft.WindowsAzure.Commands.Common.Storage.LazyAzureStorageContext]$AccountContext,

		[Parameter()]
		[ValidateSet("Hot", "Cool", "Archive")]
		[string]$AccessTier = "Hot",

		[Parameter()]
		[string]$ContentType = $null
	)

	$blobProperties = CreateBlobProperties `
					-SourceContentPath $SourceContentPath `
					-BlobPath $BlobPath `
					-ContainerName $ContainerName `
					-AccountContext $AccountContext `
					-AccessTier $AccessTier `
					-ContentType $ContentType;

	try
	{
		Write-Verbose "Start uploading blob '$($BlobPath)' from local file '$($SourceContentPath)'.";
		Set-AzStorageBlobContent @blobProperties -Force -ErrorAction:Stop | out-null;
		Write-Verbose "Finished uploading blob '$($BlobPath)' from local file '$($SourceContentPath)'.";
	}
	catch
	{
		Write-Error "Failed uploading blob '$($BlobPath)' from local file '$($SourceContentPath)' with errorMessage '$($_.Exception.Message)'.";
	}
}

try 
{
	# set location
	$originDirectory = [System.IO.Directory]::GetCurrentDirectory();
	Push-Location $DeploymentRootDirectory;
	[System.IO.Directory]::SetCurrentDirectory($DeploymentRootDirectory);

	.\renderCodeView.ps1 -Path $([System.IO.Path]::Combine($DeploymentRootDirectory, "resume.json")) -OutputPath $([System.IO.Path]::Combine($DeploymentRootDirectory, "resumeJsonCode.html"));

	Write-Verbose "Attempting to select subscription '$($TargetSubscriptionId)'";
	Select-AzSubscription $TargetSubscriptionId | out-null;
	Write-Verbose "Selected subscription '$($TargetSubscriptionId)'";

	# Get Storage account and Context
	Write-Verbose "Attempting to get Storage Account '$($StorageAccountName)' (subscriptions/$($TargetSubscriptionId))/resourceGroups/$($ResourceGroupName)/providers/Microsoft.Storage/$($StorageAccountName))";
	$storageAccount = Get-AzStorageAccount -ResourceGroupName $ResourceGroupName -Name $StorageAccountName;
	$accountContext = $storageAccount.Context;
	Write-Verbose "Storage Account found and Context acquired";

	# Get Storage Account Container Context;
	$containerContext = Get-AzStorageContainer -Name $TargetContainerName -Context $accountContext;

	UploadBlob -SourceContentPath $([System.IO.Path]::Combine($DeploymentRootDirectory, "index.html")) `
				-BlobPath "index.html" `
				-ContainerName $TargetContainerName `
				-AccountContext $AccountContext;

	UploadBlob -SourceContentPath $([System.IO.Path]::Combine($DeploymentRootDirectory, "resume.json")) `
				-BlobPath "resume.json" `
				-ContainerName $TargetContainerName `
				-AccountContext $AccountContext `
				-ContentType "application/json";

				
	UploadBlob -SourceContentPath $([System.IO.Path]::Combine($DeploymentRootDirectory, "buildInfo.json")) `
				-BlobPath "buildInfo.json" `
				-ContainerName $TargetContainerName `
				-AccountContext $AccountContext `
				-ContentType "application/json";

	UploadBlob -SourceContentPath $([System.IO.Path]::Combine($DeploymentRootDirectory, "resumeJsonCode.html")) `
				-BlobPath "resumeJsonCode.html" `
				-ContainerName $TargetContainerName `
				-AccountContext $AccountContext;

	# Fontello Icon Font
	UploadBlob -SourceContentPath $([System.IO.Path]::Combine($DeploymentRootDirectory, "css", "font", "icons", "fontello.eot")) `
				-BlobPath "css/font/icons/fontello.eot" `
				-ContainerName $TargetContainerName `
				-AccountContext $AccountContext `
				-ContentType "application/vnd.ms-fontobject";

	UploadBlob -SourceContentPath $([System.IO.Path]::Combine($DeploymentRootDirectory, "css", "font", "icons", "fontello.svg")) `
				-BlobPath "css/font/icons/fontello.svg" `
				-ContainerName $TargetContainerName `
				-AccountContext $AccountContext `
				-ContentType "image/svg+xml";

	UploadBlob -SourceContentPath $([System.IO.Path]::Combine($DeploymentRootDirectory, "css", "font", "icons", "fontello.ttf")) `
				-BlobPath "css/font/icons/fontello.ttf" `
				-ContainerName $TargetContainerName `
				-AccountContext $AccountContext `
				-ContentType "font/ttf";

	UploadBlob -SourceContentPath $([System.IO.Path]::Combine($DeploymentRootDirectory, "css", "font", "icons", "fontello.woff")) `
				-BlobPath "css/font/icons/fontello.woff" `
				-ContainerName $TargetContainerName `
				-AccountContext $AccountContext `
				-ContentType "font/woff";

	UploadBlob -SourceContentPath $([System.IO.Path]::Combine($DeploymentRootDirectory, "css", "font", "icons", "fontello.woff2")) `
				-BlobPath "css/font/icons/fontello.woff2" `
				-ContainerName $TargetContainerName `
				-AccountContext $AccountContext `
				-ContentType "font/woff2";

	# Microsoft Cascadia Code
	UploadBlob -SourceContentPath $([System.IO.Path]::Combine($DeploymentRootDirectory, "css", "font", "microsoft", "cascadia-code", "CascadiaCode.ttf")) `
				-BlobPath "css/font/microsoft/cascadia-code/CascadiaCode.ttf" `
				-ContainerName $TargetContainerName `
				-AccountContext $AccountContext `
				-ContentType "font/ttf";

	UploadBlob -SourceContentPath $([System.IO.Path]::Combine($DeploymentRootDirectory, "css", "font", "microsoft", "cascadia-code", "CascadiaCode.woff2")) `
				-BlobPath "css/font/microsoft/cascadia-code/CascadiaCode.woff2" `
				-ContainerName $TargetContainerName `
				-AccountContext $AccountContext `
				-ContentType "font/woff2";;
	
	# Rendered LESS 
	UploadBlob -SourceContentPath $([System.IO.Path]::Combine($DeploymentRootDirectory, "css", "min", "site.css")) `
				-BlobPath "css/min/site.css" `
				-ContainerName $TargetContainerName `
				-AccountContext $AccountContext;
	
	UploadBlob -SourceContentPath $([System.IO.Path]::Combine($DeploymentRootDirectory, "css", "min", "site.min.css")) `
				-BlobPath "css/min/site.min.css" `
				-ContainerName $TargetContainerName `
				-AccountContext $AccountContext;
}
finally
{
	Pop-Location;
	[System.IO.Directory]::SetCurrentDirectory($originDirectory);
}




