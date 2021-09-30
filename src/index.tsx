import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import { App } from './components/App'
import ReactModal from 'react-modal'

/*
  Important for Accessibility to make sure main app is hidden when modals are active.
  See http://reactcommunity.org/react-modal/accessibility/#app-element
*/
ReactModal.setAppElement('#root')

ReactDOM.render(<App />, document.getElementById('root'))
