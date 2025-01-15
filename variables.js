const variablesPerUps = [
	{ id: 'status', name: 'The status of the #name# UPS entity' },
	{ id: 'charge', name: 'The charge percentage of the #name# UPS entity' },
]

module.exports = function (self) {
	let compiledVariableDefinitions = []

	const upsIds = self.upsList.map((item) => item.name)

	upsIds.forEach((id) =>
		variablesPerUps.forEach((variable) =>
			compiledVariableDefinitions.push({
				variableId: `${id}_${variable.id}`,
				name: variable.name.replace(/#name#/g, id),
			}),
		),
	)

	self.setVariableDefinitions(compiledVariableDefinitions)
}
