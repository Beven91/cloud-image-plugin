import './index.css'
import React  from 'react';
import b from './images/b.jpeg'
import(/* webpackChunkName: "project.config" */'./project.config.json')

export default class DemoApp {
  render(){
    return (
      <div>
        <img src={require('./images/a.jpg')} />
        <img src={b} />
      </div>
    )
  }
}