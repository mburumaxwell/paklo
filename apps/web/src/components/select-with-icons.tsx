import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { LabelMappingValue } from '@/lib/enums';

type SelectWithIconsOption<Value extends string> = Pick<
  LabelMappingValue,
  'label' | 'icon' | 'image' | 'disabled' | 'description'
> & {
  value: Value;
};
interface SelectWithIconsProps<Value extends string = string, Multiple extends boolean | undefined = false>
  extends
    React.ComponentProps<typeof Select<Value, Multiple>>,
    Pick<React.ComponentProps<typeof SelectTrigger>, 'id' | 'className'>,
    Pick<React.ComponentProps<typeof SelectValue>, 'placeholder'> {
  options: SelectWithIconsOption<Value>[];

  /**
   * Whether to show the description text for each option (if available).
   * @default false
   */
  descriptions?: boolean;
}

export function SelectWithIcons<Value extends string = string, Multiple extends boolean | undefined = false>({
  id,
  className,
  placeholder,
  options,
  descriptions,
  ...props
}: SelectWithIconsProps<Value, Multiple>) {
  return (
    <Select<Value, Multiple> {...props} items={options}>
      <SelectTrigger id={id} className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
            <div className='flex items-center gap-2'>
              {option.icon && <option.icon className='size-4' />}
              {!option.icon && option.image && <option.image className='size-4' />}
              {option.label}
              {descriptions && option.description && (
                <p className='text-sm text-muted-foreground'>{option.description}</p>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
