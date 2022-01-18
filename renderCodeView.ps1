[CmdletBinding()]
Param(
	[Parameter(Mandatory = $true)]
	[string]$Path,

	[Parameter(Mandatory = $true)]
	[string]$OutputPath,

	[Parameter()]
	[int]$IndentSize = 2
)

$constSpace = "&nbsp;";

Write-Verbose "'`$Path' = '$($Path)'";
Write-Verbose "'`$OutputPath' = '$($OutputPath)'";
Write-Verbose "'`$IndentSize' = '$($IndentSize)'";

function WritePropertyName {
	Param(
		[Parameter(Mandatory = $true)]
		[System.Xml.XmlWriter]$Writer,

		[Parameter(Mandatory = $true)]
		[System.Type]$type,

		[Parameter(Mandatory = $true)]
		[System.String]$propertyName
	)		

	$Writer.WriteStartElement("span");
	$Writer.WriteAttributeString("class", "json-decoration json-decoration-quote json-decoration-quote-open json-property-name-decoration json-property-name-decoration-open")
	$Writer.WriteString("`"");
	$Writer.WriteEndElement();

	$Writer.WriteStartElement("span");
	$Writer.WriteAttributeString("class", "json-content json-property-name")
	$Writer.WriteAttributeString("data-typeinfo", $type.FullName)
	$Writer.WriteString($propertyName); 
	$Writer.WriteEndElement();

	$Writer.WriteStartElement("span");
	$Writer.WriteAttributeString("class", "json-decoration json-decoration-quote json-decoration-quote-close  json-property-name-decoration json-property-name-decoration-close")
	$Writer.WriteString("`"");
	$Writer.WriteEndElement();

	$Writer.WriteStartElement("span");
	$Writer.WriteAttributeString("class", "json-decoration json-decoration-colon")
	$Writer.WriteString(": ");
	$Writer.WriteEndElement();
}

function WriteLineStart {
	Param(
		[Parameter(Mandatory = $true)]
		[System.Xml.XmlWriter]$Writer,

		[Parameter(Mandatory = $true)]
		[int]$Depth,

		[Parameter(Mandatory = $true)]
		[ref]$Line
	)
	
	$Writer.WriteStartElement("div");
	$Writer.WriteAttributeString("class", "line line-$($Line.Value)");

	$Writer.WriteStartElement("span");
	$Writer.WriteAttributeString("class", "line-number-designator");
	$Writer.WriteRaw("$($Line.Value.ToString()).$($constSpace)$($constSpace)");
	$Writer.WriteEndElement();

	$indentStr = CreateSpace -Size ($Depth * $IndentSize);

	$Writer.WriteStartElement("span");
	$Writer.WriteAttributeString("class", "indent-space");
	$Writer.WriteRaw($indentStr);
	$Writer.WriteEndElement();
}

function WriteValue {
	Param(
		[Parameter(Mandatory = $true)]
		[System.Xml.XmlWriter]$Writer,

		[Parameter(Mandatory = $true)]
		[System.Type]$type,

		[Parameter(Mandatory = $true)]
		[System.String]$propertyValue,

		[Parameter(Mandatory = $true)]
		[System.Boolean]$TrailingComma
	)	

	if($type.FullName -eq "System.String")
	{
		$Writer.WriteStartElement("span");
		$Writer.WriteAttributeString("class", "json-decoration json-decoration-quote json-decoration-quote-open json-property-value-decoration json-property-value-decoration-open d-vt-$($type.Name.ToLowerInvariant()) d-vt-open-$($type.Name.ToLowerInvariant())")
		$Writer.WriteString("`"");
		$Writer.WriteEndElement();
	}

	$Writer.WriteStartElement("span");
	$Writer.WriteAttributeString("class", "json-content json-property-value vt-$($type.Name.ToLowerInvariant())")
	$Writer.WriteAttributeString("data-typeinfo", $type.FullName);
	$Writer.WriteString($propertyValue); 
	$Writer.WriteEndElement();

	if($type.FullName -eq "System.String")
	{
		$Writer.WriteStartElement("span");
		$Writer.WriteAttributeString("class", "json-decoration json-decoration-quote json-decoration-quote-close json-property-value-decoration json-property-value-decoration-close d-vt-$($type.Name.ToLowerInvariant()) d-vt-close-$($type.Name.ToLowerInvariant())")
		$Writer.WriteString("`"");
		$Writer.WriteEndElement();
	}

	if($TrailingComma)
	{	
		$Writer.WriteStartElement("span");
		$Writer.WriteAttributeString("class", "json-decoration json-decoration-comma")
		$Writer.WriteString(", ");
		$Writer.WriteEndElement();
	}
}

function WriteBracketStandalone {
	Param(
		[Parameter(Mandatory = $true)]
		[System.Xml.XmlWriter]$Writer,

		[Parameter(Mandatory = $true)]
		[int]$Depth,

		[Parameter(Mandatory = $true)]
		[ref]$Line,

		[Parameter(Mandatory = $true)]
		[string]$Character,

		[Parameter()]
		[switch]$TrailingComma
	)

	$Writer.WriteStartElement("div");
	$Writer.WriteAttributeString("class", "line line-$($Line.Value)");

	$Writer.WriteStartElement("span");
	$Writer.WriteAttributeString("class", "line-number-designator");
	$Writer.WriteRaw("$($Line.Value.ToString()).$($constSpace)$($constSpace)");
	$Writer.WriteEndElement();

	$indentStr = CreateSpace -Size ($Depth * $IndentSize);

	$Writer.WriteStartElement("span");
	$Writer.WriteAttributeString("class", "indent-space");
	$Writer.WriteRaw($indentStr);
	$Writer.WriteEndElement();

	switch($Character) {
		"{" { $specific = "json-decoration-brackets-object-open" }
		"}" { $specific = "json-decoration-brackets-object-close" }
		"[" { $specific = "json-decoration-brackets-array-open" }
		"]" { $specific = "json-decoration-brackets-array-close" }
	}

	$Writer.WriteStartElement("span");
	$Writer.WriteAttributeString("class", "json-decoration json-decoration-brackets $specific");




	$Writer.WriteString($character);

	$Writer.WriteEndElement();

	if($TrailingComma)
	{
		$Writer.WriteStartElement("span");
		$Writer.WriteAttributeString("class", "json-decoration json-decoration-comma")
		$Writer.WriteString(",");
		$Writer.WriteEndElement();
	}

	$Writer.WriteEndElement();

	$Line.Value++;
}

function CreateSpace {
	Param(
		[Parameter(Mandatory = $true)]
		[int]$Size
	)

	$spaces = New-Object 'string[]' $Size;

	for($i = 0; $i -lt $Size; $i++)
	{
		$spaces[$i] = $constSpace;
	}

	$result = [System.String]::Concat($spaces);

	return $result;
}

function TraverseObject {
	Param(
		[Parameter(Mandatory = $true)]
		[System.Xml.XmlWriter]$Writer,

		[Parameter(Mandatory = $true)]
		[object]$InputObject,

		[Parameter(Mandatory = $true)]
		[int]$Depth,

		[Parameter(Mandatory = $true)]
		[ref]$Line
	)

	$properties = $InputObject | Get-Member -MemberType NoteProperty;

	for($p = 0; $p -lt $properties.count; $p++)
	{
		$property = $InputObject.PSObject.Properties[$properties[$p].Name];

		if($property.Value -ne $null)
		{
			$type = $property.Value.GetType();
		}

		
		Write-Verbose "Inspecting Property '$($properties[$p].Name)' of type '$($type.name)' ";

		$Writer.WriteStartElement("div");
		$Writer.WriteAttributeString("class", "line line-$($Line.Value)");

		$Writer.WriteStartElement("span");
		$Writer.WriteAttributeString("class", "line-number-designator");
		$Writer.WriteRaw("$($Line.Value.ToString()).$($constSpace)$($constSpace)");
		$Writer.WriteEndElement();

		$indentStr = CreateSpace -Size ($Depth * $IndentSize);

		$Writer.WriteStartElement("span");
		$Writer.WriteAttributeString("class", "indent-space");
		$Writer.WriteRaw($indentStr);
		$Writer.WriteEndElement();

		WritePropertyName -Writer $Writer -Type $type -PropertyName $property.Name;

		if($type -ne $null -and $type.IsArray) {
			Write-Verbose "Property '$($properties[$p].Name)' is an array type";

			$Writer.WriteStartElement("span");
			$Writer.WriteAttributeString("class", "json-decoration json-decoration-brackets json-decoration-brackets-array-open");
			$Writer.WriteString("[");
			$Writer.WriteEndElement();

			$Writer.WriteEndElement();
			
			$Line.Value++;

			# Iterate array items
			for($i = 0; $i -lt $property.Value.Length; $i++)
			{
				$pt = $property.Value[$i].GetType();

				if($pt.FullName -eq "System.String" -or $pt.IsValueType -eq $true)
				{
					$Depth++;
					
					WriteLineStart -Writer $Writer -Depth $Depth -Line $Line;

					WriteValue -Writer $Writer -Type $pt -PropertyValue $property.Value[$i].ToString() -TrailingComma ($i -ne $property.Value.Length -1);

					$Writer.WriteEndElement();

					$Depth--
				}
				else
				{
					$Depth++;

					WriteBracketStandalone -Writer $Writer -Depth $Depth -Line $Line -Character '{';
					
					$Depth++;

					TraverseObject -Writer $Writer -InputObject $property.Value[$i] -Depth $Depth -Line $Line;

					$Depth--

					if($i -eq $property.Value.Length -1)
					{	
						WriteBracketStandalone -Writer $Writer -Depth $Depth -Line $Line -Character '}';
					}
					else
					{
						WriteBracketStandalone -Writer $Writer -Depth $Depth -Line $Line -Character '}' -TrailingComma;
					}

					$Depth--;
				}
			}

			if($p -eq $properties.count -1)
			{	
				WriteBracketStandalone -Writer $Writer -Depth $Depth -Line $Line -Character ']';
			}
			else
			{
				WriteBracketStandalone -Writer $Writer -Depth $Depth -Line $Line -Character ']' -TrailingComma;
			}

		}
		elseif($type -ne $null -and $type.FullName -eq "System.Management.Automation.PSCustomObject") 
		{
			$Writer.WriteStartElement("span");
			$Writer.WriteAttributeString("class", "json-decoration json-decoration-brackets json-decoration-brackets-object-open");
			$Writer.WriteString("{");
			$Writer.WriteEndElement();

			$Writer.WriteEndElement();
			
			$Line.Value++;

			$Depth++
			TraverseObject -Writer $Writer -InputObject $property.Value -Depth $Depth -Line $Line;
			$Depth--

			if($p -eq $properties.count -1)
			{	
				WriteBracketStandalone -Writer $Writer -Depth $Depth -Line $Line -Character '}';
			}
			else
			{
				WriteBracketStandalone -Writer $Writer -Depth $Depth -Line $Line -Character '}' -TrailingComma;
			}
		}
		else
		{
			WriteValue -Writer $Writer -Type $type -PropertyValue $property.Value.ToString() -TrailingComma ($p -eq $properties.count -1);

			$Writer.WriteEndElement();
			
			$Line.Value++;

		}


	}

}

if((Test-Path -Path $OutputPath) -eq $true)
{
	Write-Verbose "Found existing file at '$($OutputPath)' deleting";
	Remove-Item $OutputPath -Force;
}

$Line = 1;
$Depth = 0;

$fileStream = New-Object System.IO.FileStream @($OutputPath, [system.io.filemode]::OpenOrCreate, [System.IO.FileAccess]::Write, [System.IO.FileShare]::None);
$fileStream.SetLength(0);

$originWorkingDirectory = [System.IO.Directory]::GetCurrentDirectory();

try
{
	push-location $PSScriptRoot;
	[System.IO.Directory]::SetCurrentDirectory($PSScriptRoot);

	$xmlWriterSettings = New-Object System.Xml.XmlWriterSettings;
	$xmlWriterSettings.Indent = $false;
	$xmlWriter = [System.Xml.XmlWriter]::Create($fileStream, $xmlWriterSettings);

	$resumeJson = Get-Content $path;
	$resume = $resumeJson | ConvertFrom-Json;

	$xmlWriter.WriteStartElement("div");
	$xmlWriter.WriteAttributeString("class", "code-container");

	WriteBracketStandalone -Writer $xmlWriter -Depth $Depth -Line ([ref]$Line) -Character "{";

	TraverseObject -Writer $xmlWriter -InputObject $resume -Depth $Depth -Line ([ref]$Line);
	# create container div

	WriteLineStart -Writer $xmlWriter -Depth $Depth -Line ([ref]$Line);

	$xmlWriter.WriteStartElement("span");
	$xmlWriter.WriteAttributeString("class", "json-decoration json-decoration-brackets json-object-close");
	$xmlWriter.WriteString("}");
	$xmlWriter.WriteEndElement();

	$Line++;

	$xmlWriter.WriteEndElement();

	$xmlWriter.WriteEndElement();

	Write-Warning $fileStream.Name;

	$xmlWriter.Flush();
	$xmlWriter.Close();
}
finally
{
	$fileStream.Close();
	$fileStream.Dispose();
	pop-location;
	[System.IO.Directory]::SetCurrentDirectory($originWorkingDirectory);
}