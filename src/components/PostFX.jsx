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
        <Bloom luminanceThreshold={0.65} luminanceSmoothing={0.35} intensity={0.8} mipmapBlur />
        <Vignette offset={0.2} darkness={0.85} />
      </EffectComposer>
    </PPBoundary>
  )
}
