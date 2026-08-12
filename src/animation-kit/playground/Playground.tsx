import { useState } from 'react'
import { WordleGuessGame } from '../WordleGuessGame'
import { TagRiddleAnimation } from '../TagRiddleAnimation'
import { CompletionAnimation } from '../CompletionAnimation'
import { fonts, theme } from '../theme'
import {
  mockAnswer,
  mockArtifact,
  mockClue,
  mockCompletion,
  mockEvaluate,
  mockSpacedAnswer,
} from './mockData'

type Scene = 'wordle' | 'spaced' | 'clue' | 'completion'

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
        {(['wordle', 'spaced', 'clue', 'completion'] as Scene[]).map((s) => (
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
            hint="A little race where friends pass a baton paw to paw"
            hint2="It's 5 letters, starts with R and ends with Y"
            hint3="Think '___ race' — teammates handing something off one after another"
            artifactSrc={mockArtifact}
            artifactAlt="Curious Kat"
            maxAttempts={6}
            evaluateGuess={mockEvaluate(mockAnswer)}
            onResolved={(solved) =>
              console.log('[playground] resolved, solved =', solved)
            }
          />
        )}
        {scene === 'spaced' && (
          <WordleGuessGame
            answerLength={mockSpacedAnswer.length}
            answer={mockSpacedAnswer}
            hint="Two words — spaces are fixed, you only guess the letters"
            artifactSrc={mockArtifact}
            artifactAlt="Curious Kat"
            maxAttempts={6}
            evaluateGuess={mockEvaluate(mockSpacedAnswer)}
            onResolved={(solved) =>
              console.log('[playground] spaced resolved, solved =', solved)
            }
          />
        )}
        {scene === 'clue' && (
          <TagRiddleAnimation riddleTitle="Treat One" riddleText={mockClue} />
        )}
        {scene === 'completion' && <CompletionAnimation message={mockCompletion} />}
      </div>
    </div>
  )
}

function tabStyle(active: boolean): React.CSSProperties {
  return {
    padding: '8px 16px',
    borderRadius: 999,
    border: `1px solid ${active ? theme.peach : theme.panelEdge}`,
    background: active ? theme.peachSoft : 'transparent',
    color: active ? theme.text : theme.textDim,
    fontFamily: fonts.display,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  }
}
