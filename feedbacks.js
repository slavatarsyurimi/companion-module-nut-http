const { combineRgb } = require('@companion-module/base')
const _ = require('lodash')

module.exports = async function (self) {
	const upsListKeyMapping = {
		name: 'id',
		description: 'label',
	};

	let upsChoices = _.map(self.upsList, obj => _.mapKeys(obj, (value, key) => upsListKeyMapping[key] || key))

	upsChoices = _.map(upsChoices, function (obj) {
		obj.label = `${obj.id} - ${obj.label}`
		return obj
	})

	self.setFeedbackDefinitions({
		UPSOnMains: {
			name: 'UPS on mains',
			type: 'boolean',
			label: 'UPS on mains',
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 0),
				color: combineRgb(0, 0, 0),
			},
			options: [{
				id: 'ups',
				type: 'dropdown',
				label: 'Select the UPS',
				choices: upsChoices,
				default: _.get(upsChoices, '0.id')
			}],
			callback: (feedback) => {
				return _.get(self.deviceData, `${feedback.options.ups}.statusnum`) <= 2
			},
		},

		UPSOnBattery: {
			name: 'UPS on battery',
			type: 'boolean',
			label: 'UPS on battery',
			defaultStyle: {
				bgcolor: combineRgb(204, 0, 0),
				color: combineRgb(255, 255, 255),
			},
			options: [{
				id: 'ups',
				type: 'dropdown',
				label: 'Select the UPS',
				choices: upsChoices,
				default: _.get(upsChoices, '0.id')
			}],
			callback: (feedback) => {
				return _.get(self.deviceData, `${feedback.options.ups}.statusnum`) >= 3
			},
		},

		UPSAlive: {
			name: 'UPS connection alive',
			type: 'boolean',
			label: 'UPS connection alive',
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 0),
				color: combineRgb(0, 0, 0),
			},
			options: [{
				id: 'ups',
				type: 'dropdown',
				label: 'Select the UPS',
				choices: upsChoices,
				default: _.get(upsChoices, '0.id')
			}],
			callback: (feedback) => {
				return Boolean(_.get(self.deviceData, `${feedback.options.ups}.alive`))
			},
		},
	})
}
