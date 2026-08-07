import { CompletionAnimation } from '../animation-kit/CompletionAnimation'

interface CompletionScreenProps {
  message: string
}

export function CompletionScreen({ message }: CompletionScreenProps) {
  return <CompletionAnimation message={message} />
}
