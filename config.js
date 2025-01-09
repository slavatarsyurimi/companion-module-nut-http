const { Regex } = require('@companion-module/base')

module.exports = [
	{
		type: 'textinput',
		id: 'host',
		label: 'Target Host',
		width: 6,
		regex: Regex.HOSTNAME,
	},
	{
		type: 'textinput',
		id: 'port',
		label: 'Target Port',
		width: 3,
		regex: Regex.PORT,
	},
	{
		type: 'checkbox',
		id: 'https',
		label: 'Use HTTPS',
		width: 3,
	},
]
