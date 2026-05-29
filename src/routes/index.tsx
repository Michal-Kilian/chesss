import { Component } from "solid-js";
import { ModeToggle } from "~/components/mode-toggle";
import { Button } from "~/components/ui/button";

const HomePage: Component = () => {
  return (
    <div class="relative min-h-screen w-full flex items-center justify-center bg-background text-foreground">
      <h1 class="text-5xl">Solidstart Template</h1>

      <ModeToggle class="absolute right-5 top-5" />
    </div>
  );
};

export default HomePage;
