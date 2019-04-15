function ListenToSerial(PortName)
{
	Pop.Debug("Opening " + PortName );
	let ComPort = new Pop.Serial.ComPort(PortName,115200);
	
	let Loop = async function()
	{
		while ( true )
		{
			let NewData = await ComPort.Read();
			Pop.Debug(PortName + ": " + NewData);
		}
	}

	Loop().catch(Pop.Debug);
}

const SerialPorts = Pop.Serial.EnumPorts();
Pop.Debug("Found x" + SerialPorts.length +" serial ports");
SerialPorts.forEach( ListenToSerial );

