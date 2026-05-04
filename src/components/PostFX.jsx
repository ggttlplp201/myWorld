import { Component } from 'react'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'

class PPBoundary extends Component {
  state = { crashed: false }
  static getDerivedStateFromError() { return { crashed: true } }
  render() { return this.state.crashed ? null : this.props.children }
}

export default function PostFX() {
  return (
    <PPBoundary>
      <EffectComposer multisampling={0}>
        <Bloom luminanceThreshold={0.88} luminanceSmoothing={0.25} intensity={0.7} />
        <Vignette offset={0.2} darkness={0.85} />
      </EffectComposer>
    </PPBoundary>
  )
}
