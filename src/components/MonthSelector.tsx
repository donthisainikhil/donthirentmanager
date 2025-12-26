import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { formatMonth, getNextMonth, getPrevMonth } from '@/lib/formatters';

export function MonthSelector() {
  const { selectedMonth, setSelectedMonth } = useStore();

  const handlePrev = () => {
    setSelectedMonth(getPrevMonth(selectedMonth));
  };

  const handleNext = () => {
    setSelectedMonth(getNextMonth(selectedMonth));
  };

  return (
    <div className="flex items-center gap-2 bg-card rounded-xl border shadow-card px-4 py-2">
      <Button variant="ghost" size="icon" onClick={handlePrev}>
        <ChevronLeft className="w-5 h-5" />
      </Button>
      <span className="font-semibold text-lg min-w-[140px] text-center">
        {formatMonth(selectedMonth)}
      </span>
      <Button variant="ghost" size="icon" onClick={handleNext}>
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  );
}
