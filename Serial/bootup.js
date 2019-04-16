function isString(value)
{
	return typeof value === 'string' || value instanceof String;
}

let ListenToSerial = async function(PortName)
{
	if ( PortName.includes('Bluetooth') )
		return;
	
	//	if we try to open TTY ports for reading, open() hangs atm (which blocks JS)
	if ( !PortName.includes('/dev/cu.') )
	{
		return;
	}

	while(true)
	{
		try
		{
			Pop.Debug("Opening " + PortName +"..." );
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
			//	wait before reconnecting
			Pop.Debug(e);
			await Pop.Yield(1000);
		}
	}

}

const SerialPorts = Pop.Serial.EnumPorts();
Pop.Debug("Found x" + SerialPorts.length +" serial ports; " + SerialPorts.join(',') );
SerialPorts.forEach( ListenToSerial );
