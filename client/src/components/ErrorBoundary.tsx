import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type Props = { children: ReactNode; fallbackTitle?: string };
type State = { hasError: boolean; message?: string };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <section
          role="alert"
          className="mx-auto max-w-lg rounded-lg border bg-card p-8 text-center"
        >
          <h2 className="font-display text-2xl font-semibold">
            {this.props.fallbackTitle ?? "Something went wrong"}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {this.state.message ?? "An unexpected error occurred."}
          </p>
          <Button
            className="mt-6"
            onClick={() => {
              this.setState({ hasError: false, message: undefined });
              window.location.assign("/");
            }}
          >
            Go home
          </Button>
        </section>
      );
    }
    return this.props.children;
  }
}
