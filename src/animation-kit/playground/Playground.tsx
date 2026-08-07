import { useState } from 'react'
import { WordleGuessGame } from '../WordleGuessGame'
import { TagRiddleAnimation } from '../TagRiddleAnimation'
import { CompletionAnimation } from '../CompletionAnimation'
import { theme } from '../theme'
import {
  mockAnswer,
  mockClue,
  mockCompletion,
  mockEvaluate,
} from './mockData'

type Scene = 'wordle' | 'clue' | 'completion'

/**
 * Dev-only harness for iterating on the animation kit in isolation, with mock
 * data and a replay control. Reachable at #/playground in `npm run dev` only.
 * The design workstream lives here — it never needs the real app/data/routing.
 */
export function Playground() {
  const [scene, setScene] = useState<Scene>('wordle')
  const [replay, setReplay] = useState(0)

  return (
    <div style={{ width: '100%', maxWidth: 640 }}>
      <div
        style={{
          display: 'flex',
          gap: 8,
          justifyContent: 'center',
          marginBottom: 28,
          flexWrap: 'wrap',
        }}
      >
        {(['wordle', 'clue', 'completion'] as Scene[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setScene(s)
              setReplay((r) => r + 1)
            }}
            style={tabStyle(scene === s)}
          >
            {s}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setReplay((r) => r + 1)}
          style={tabStyle(false)}
        >
          ↻ replay
        </button>
      </div>

      <div key={replay}>
        {scene === 'wordle' && (
          <WordleGuessGame
            answerLength={mockAnswer.length}
            answer={mockAnswer}
            hint="A station that receives a signal and passes it along"
            maxAttempts={6}
            evaluateGuess={mockEvaluate(mockAnswer)}
            onResolved={(solved) =>
              console.log('[playground] resolved, solved =', solved)
            }
          />
        )}
        {scene === 'clue' && (
          <TagRiddleAnimation riddleTitle="Transmission 01" riddleText={mockClue} />
        )}
        {scene === 'completion' && <CompletionAnimation message={mockCompletion} />}
      </div>
    </div>
  )
}

function tabStyle(active: boolean): React.CSSProperties {
  return {
    padding: '8px 16px',
    borderRadius: 8,
    border: `1px solid ${active ? theme.cyan : theme.panelEdge}`,
    background: active ? `${theme.cyan}18` : 'transparent',
    color: active ? theme.cyan : theme.textDim,
    fontFamily: 'ui-monospace, monospace',
    fontSize: 13,
    cursor: 'pointer',
  }
}
