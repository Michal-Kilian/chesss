import { Component, JSX, Show } from "solid-js";

interface OptionButtonProps {
    label: string;
    sublabel?: string;
    icon?: JSX.Element;
    badge?: string;
    active?: boolean;
    disabled?: boolean;
    onClick?: () => void;
}

export const OptionButton: Component<OptionButtonProps> = (props: OptionButtonProps) => {
    return (
        <button
            type="button"
            disabled={props.disabled}
            onClick={props.onClick}
            class="relative flex flex-col items-center justify-center gap-1.5 rounded-lg border px-3 py-3 text-sm transition-colors"
            classList={{
                "border-neutral-300 bg-neutral-100/10 text-neutral-100 cursor-pointer": props.active,
                "border-neutral-700 bg-neutral-900 text-neutral-300 hover:border-neutral-600 cursor-pointer": !props.active && !props.disabled,
                "border-neutral-800 bg-neutral-900/50 text-neutral-600 cursor-not-allowed": props.disabled,
            }}
        >
            <Show when={props.badge}>
                <span class="absolute -top-2 -right-2 rounded-full bg-neutral-700 px-1.5 py-0.5 text-[10px] font-medium text-neutral-300">
                    {props.badge}
                </span>
            </Show>

            {props.icon}

            <span class="font-medium">{props.label}</span>
            <Show when={props.sublabel}>
                <span class="text-xs text-neutral-500">{props.sublabel}</span>
            </Show>
        </button>
    );
};
