import { Connectors } from 'web3-react'
import ensLoginSdk from 'ens-login-sdk'
import Web3 from 'web3'

const { Connector, ErrorCodeMixin } = Connectors

const network = process.env.REACT_APP_NETWORK
let enabled = false

const InjectedConnectorErrorCodes = ['ETHEREUM_ACCESS_DENIED', 'NO_WEB3', 'UNLOCK_REQUIRED']
export default class InjectedConnector extends ErrorCodeMixin(Connector, InjectedConnectorErrorCodes) {
  constructor(args = {}) {
    super(args)
    this.runOnDeactivation = []

    this.networkChangedHandler = this.networkChangedHandler.bind(this)
    this.accountsChangedHandler = this.accountsChangedHandler.bind(this)

    const { ethereum } = window
    console.log("ETHEREUM = ", ethereum)
    if (ethereum && ethereum.isMetaMask) {
      ethereum.autoRefreshOnNetworkChange = false
    }
    this.initProvider()
  }

  async initProvider() {
    const ensLoginConfig = {
      provider: {
        network: 'ropsten'
      }
    }

    this.provider = await ensLoginSdk.connect('metamask.enslogin.eth', ensLoginConfig)
  }

  async onActivation() {
    const { ethereum, web3 } = window

    if (ethereum && enabled) {
      await ethereum.enable().catch(error => {
        const deniedAccessError = Error(error)
        deniedAccessError.code = InjectedConnector.errorCodes.ETHEREUM_ACCESS_DENIED
        throw deniedAccessError
      })

      // initialize event listeners
      if (ethereum.on) {
        ethereum.on('networkChanged', this.networkChangedHandler)
        ethereum.on('accountsChanged', this.accountsChangedHandler)

        this.runOnDeactivation.push(() => {
          if (ethereum.removeListener) {
            ethereum.removeListener('networkChanged', this.networkChangedHandler)
            ethereum.removeListener('accountsChanged', this.accountsChangedHandler)
          }
        })
      }
    } else if (web3) {
      console.warn('Your web3 provider is outdated, please upgrade to a modern provider.')
    } else {
      const noWeb3Error = Error('Your browser is not equipped with web3 capabilities.')
      noWeb3Error.code = InjectedConnector.errorCodes.NO_WEB3
      throw noWeb3Error
    }
  }

  async getAccount(provider) {
    const account = await super.getAccount(provider)

    if (account === null) {
      const unlockRequiredError = Error('Ethereum account locked.')
      unlockRequiredError.code = InjectedConnector.errorCodes.UNLOCK_REQUIRED
      throw unlockRequiredError
    }

    return account
  }

  async getProvider() {
    return this.provider
  }

  onDeactivation() {
    this.runOnDeactivation.forEach(runner => runner())
    this.runOnDeactivation = []
  }

  // event handlers
  networkChangedHandler(networkId) {
    const networkIdNumber = Number(networkId)

    try {
      super._validateNetworkId(networkIdNumber)

      super._web3ReactUpdateHandler({
        updateNetworkId: true,
        networkId: networkIdNumber
      })
    } catch (error) {
      super._web3ReactErrorHandler(error)
    }
  }

  accountsChangedHandler(accounts) {
    if (!accounts[0]) {
      const unlockRequiredError = Error('Ethereum account locked.')
      unlockRequiredError.code = InjectedConnector.errorCodes.UNLOCK_REQUIRED
      super._web3ReactErrorHandler(unlockRequiredError)
    } else {
      super._web3ReactUpdateHandler({
        updateAccount: true,
        account: accounts[0]
      })
    }
  }

  async getProvider(networkId) {
    return window.ethereum
  }
}
