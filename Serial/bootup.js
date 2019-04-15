function isString(value)
{
	return typeof value === 'string' || value instanceof String;
}

function ListenToSerial(PortName)
{
	if ( !PortName.includes('cu.wchus') )
	{
		//return;
	}
	
	let Loop = async function()
	{
		while( true )
		{
			try
			{
				Pop.Debug("Opening " + PortName );
				let ReadAsString = true;
				let ComPort = new Pop.Serial.ComPort(PortName,115200,ReadAsString);
				while ( true )
				{
					let NewData = await ComPort.Read();
					if ( isString(NewData) )
						NewData = NewData.trim();
					
					Pop.Debug(PortName + ": " + NewData);
				}
			}
			catch(e)
			{
				Pop.Debug(e);
				await Pop.Yield(1000);
			}
		}
	}

	Loop().catch(Pop.Debug);
}

const SerialPorts = Pop.Serial.EnumPorts();
Pop.Debug("Found x" + SerialPorts.length +" serial ports");
SerialPorts.forEach( ListenToSerial );

