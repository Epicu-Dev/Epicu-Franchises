import { Select, SelectProps } from "@heroui/select";

interface StyledSelectProps extends Omit<SelectProps, 'listboxProps' | 'popoverProps'> {
    children: React.ReactElement | React.ReactElement[];
}

export function StyledSelect({ children, ...props }: StyledSelectProps) {
    return (
        <Select
            {...props}
            classNames={{
                base: "bg-page-bg rounded",
                mainWrapper: "bg-page-bg",
                trigger: "bg-page-bg",
            }}
            listboxProps={{
                itemClasses: {
                    base: [
                        "rounded",
                        "text-default-500",
                        "transition-opacity",
                        "data-[hover=true]:text-foreground",
                        "data-[hover=true]:bg-blue-100",
                        "data-[hover=true]:text-black",
                        "dark:data-[hover=true]:bg-blue-200",
                        "dark:data-[hover=true]:text-black",
                        "data-[selectable=true]:focus:bg-blue-100",
                        "data-[focus-visible=true]:ring-default-500",
                    ],
                },
            }}
            popoverProps={{
                classNames: {
                    trigger: "bg-blue-200",
                    content: "p-0 rounded bg-background",
                },
            }}
        >
            {children}
        </Select>
    );
}
