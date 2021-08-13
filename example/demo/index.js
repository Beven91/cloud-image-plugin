import React  from 'react';
import a from './images/a.jpg'
import b from './images/b.jpeg'
import(/* webpackChunkName: "project.config" */'./project.config.json')

export default class DemoApp {
  render(){
    return (
      <div>
        <img src={a} />
        <img src={b} />
      </div>
    )
  }
}