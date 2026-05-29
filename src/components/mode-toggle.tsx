import { useColorMode } from "@kobalte/core";
import { LaptopIcon, MoonIcon, SunIcon } from "lucide-solid";
import { Component } from "solid-js";

import { Button } from "~/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "~/components/ui/dropdown-menu";
import { cn } from "~/lib/utils";

interface ModeToggleProps {
    class?: string;
}

export const ModeToggle: Component<ModeToggleProps> = (props: ModeToggleProps) => {
    const { setColorMode } = useColorMode();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                as={Button<"button">}
                variant="ghost"
                size="sm"
                class={cn("w-9 px-0 cursor-pointer", props.class)}
            >
                <SunIcon class="size-6 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <MoonIcon class="absolute size-6 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span class="sr-only">Toggle theme</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => setColorMode("light")} class="cursor-pointer">
                    <SunIcon class="mr-2 size-4" />
                    <span>Light</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setColorMode("dark")} class="cursor-pointer">
                    <MoonIcon class="mr-2 size-4" />
                    <span>Dark</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setColorMode("system")} class="cursor-pointer">
                    <LaptopIcon class="mr-2 size-4" />
                    <span>System</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};