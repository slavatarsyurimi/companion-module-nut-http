const { InstanceBase, Regex, runEntrypoint, InstanceStatus } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades')
const UpdateActions = require('./actions')
const UpdateFeedbacks = require('./feedbacks')
const UpdateVariableDefinitions = require('./variables')
const configFields = require('./config')
const axios = require('axios')
const https = require('https')
const _ = require('lodash')

class ModuleInstance extends InstanceBase {
	poller = null
	pendingVariablesUpdates = []
	deviceData = []

	constructor(internal) {
		super(internal)

		this.agent = new https.Agent({
			rejectUnauthorized: false,
		});
	}

	async init(config) {
		this.config = config
		this.initApiConnection()

		this.updateActions() // export actions
		this.updateFeedbacks() // export feedbacks
	}

	// When module gets deleted
	async destroy() {
		this.log('debug', 'destroy')

		this.poller?.stopInterval()
	}

	async configUpdated(config) {
		this.log('debug', 'Config updated')
		this.config = config

		clearInterval(this.poller)
		this.initApiConnection()
	}

	initApiConnection() {
		this.updateStatus(InstanceStatus.Connecting)

		const prefix = this.config.https ? 'https' : 'http';
		const url = `${prefix}://${this.config.host}:${this.config.port}/devices`
		console.log('Attempting connection to:', url)

		this.log('info', 'Initializing connection')

		axios
			.get(url, { httpsAgent: this.agent, params: { parsed: true }, timeout: 5000 })
			.then((response) => {
				if (typeof response.data !== 'object') {
					this.updateStatus(InstanceStatus.ConnectionFailure, `${url} must return an Object`)
					return
				}

				const upsIdsOld = response.data.map((item) => item.name)
				const upsIdsNew = this.upsList?.map((item) => item.name)

				this.upsList = response.data

				if (!_.isEqual(upsIdsOld, upsIdsNew)) {
					this.updateVariableDefinitions()
					this.updateFeedbacks()
				}

				console.info('UPS list upon connection', this.upsList)

				this.updateStatus(InstanceStatus.Ok)

				this.updateCycle()
				this.poller = setInterval(() => this.updateCycle(), this.config.refresh_rate);
			})
			.catch((error) => {
				console.error(error);
				this.updateStatus(InstanceStatus.ConnectionFailure, error.message)
			})
	}

	async updateCycle() {
		this.log('info', 'Running an update cycle')
		this.pendingVariablesUpdates = []

		const apiCalls = this.upsList.map((ups) => this.getDeviceData(ups.name))
		await Promise.all(apiCalls)

		this.updateVariableData()
		this.checkFeedbacks()
	}

	updateVariableData() {
		const updatables = this.pendingVariablesUpdates.reduce((acc, { id, value }) => {
			acc[id] = value;
			return acc;
		}, {});

		this.setVariableValues(updatables);
	}

	async getDeviceData(device) {
		return new Promise((resolve, reject) => {
			const url = `http://${this.config.host}:${this.config.port}/devices/${device}`

			axios.get(url, { httpsAgent: this.agent, params: { parsed: true } , timeout: 5000}).then((response) => {
				const data = response.data

				this.pendingVariablesUpdates.push({ id: `${device}_status`, value: data.ups.status })
				this.pendingVariablesUpdates.push({ id: `${device}_charge`, value: data.battery.charge })

				_.set(this.deviceData, `${device}.status`, data.ups.status)
				_.set(this.deviceData, `${device}.alive`, true)
				_.set(this.deviceData, `${device}.charge`, data.ups.charge)
				_.set(this.deviceData, `${device}.statusnum`, data.ups.statusnum)

				resolve();
			}).catch((error) => {
				console.log('getDeviceData call failed')

				this.pendingVariablesUpdates.push({ id: `${device}_status`, value: null })
				this.pendingVariablesUpdates.push({ id: `${device}_charge`, value: null })

				_.set(this.deviceData, `${device}.status`, null)
				_.set(this.deviceData, `${device}.alive`, false)
				_.set(this.deviceData, `${device}.charge`, null)
				_.set(this.deviceData, `${device}.statusnum`, null)

				resolve()
			})
		})
	}

	getConfigFields() {
		return configFields
	}

	updateActions() {
		UpdateActions(this)
	}

	updateFeedbacks() {
		UpdateFeedbacks(this)
	}

	updateVariableDefinitions() {
		UpdateVariableDefinitions(this)
	}
}

runEntrypoint(ModuleInstance, UpgradeScripts)
