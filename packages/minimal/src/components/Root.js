import React, { Component } from "react";
import PropTypes from 'prop-types';

import Notifications from './Notifications';
import Loading       from './Loading';
import Login         from './Login';
import Main          from './Main';

import { scrollTo } from '../utils';

class Root extends Component
{
	constructor(props)
	{
		super(props);
		this.state = { view: 'Login' };
	}

	componentDidMount()
	{
		this.subscription = this.props.services.emitter.addListener('updateView', this.updateView.bind(this));
	}

	componentWillUnmount()
	{
		this.subscription.remove();
	}

	updateView()
	{
		this.setState({ view: this.props.services.provider === null ? 'Login' : 'Main' });
		scrollTo(0, 0);
	}

	render()
	{
			// { this.state.viewParameters.loading && <Loading/> }
		return (
			<>
			<Notifications emitter={this.props.services.emitter}/>
			{
			  (this.state.view === 'Login')
			? <Login services={this.props.services}/>
			: (this.state.view === 'Main')
			? <Main services={this.props.services}/>
			: <div>Oups, nothing to render</div>
			}
			</>
		);
	}
}

Root.propTypes =
{
	services: PropTypes.object
};

export default Root;
