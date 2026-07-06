import { Component, PropsWithChildren, ReactNode } from "react";
import { ErrorState, Screen } from "./ui";

type ErrorBoundaryState = {
  error: Error | null;
};

export class AppErrorBoundary extends Component<PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  reset = () => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (this.state.error) {
      return (
        <Screen contentStyle={{ justifyContent: "center" }} scroll={false}>
          <ErrorState
            title="App error"
            message="LCMP Mobile hit an unexpected screen error. Try again, and sign in again if the problem persists."
            onRetry={this.reset}
          />
        </Screen>
      );
    }

    return this.props.children;
  }
}
