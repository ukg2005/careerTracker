<script lang="ts">
  let { 
      size = 200, 
      thickness = 24, 
      sections = [], 
      label = '' 
  } = $props<{
      size?: number;
      thickness?: number;
      sections: { value: number; color: string; tooltip?: string }[];
      label?: string | import('svelte').Snippet;
  }>();

  // Circle geometry
  let center = $derived(size / 2);
  let radius = $derived(center - thickness / 2);
  let circumference = $derived(2 * Math.PI * radius);

  // Calculate offsets for each section using Svelte 5 $derived.by
  let sectionsWithOffsets = $derived.by(() => {
      let currentOffset = 0;
      return sections.map(section => {
          const value = Math.min(100, Math.max(0, section.value));
          const dashArray = (value / 100) * circumference;
          const dashOffset = -currentOffset;
          
          currentOffset += dashArray;
          
          return {
              ...section,
              dashArray: `${dashArray} ${circumference}`,
              dashOffset
          };
      });
  });
</script>

<div class="relative inline-flex items-center justify-center" style="width: {size}px; height: {size}px;">
  <svg width={size} height={size} viewBox="0 0 {size} {size}" class="-rotate-90 transform">
      <!-- Background track -->
      <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#f1f3f5"
          stroke-width={thickness}
      />
      
      <!-- Colored segments -->
      {#each sectionsWithOffsets as section}
          {#if section.value > 0}
              <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={section.color}
                  stroke-width={thickness}
                  stroke-dasharray={section.dashArray}
                  stroke-dashoffset={section.dashOffset}
                  class="transition-all duration-500 ease-in-out"
              >
                  {#if section.tooltip}
                      <title>{section.tooltip}</title>
                  {/if}
              </circle>
          {/if}
      {/each}
  </svg>
  
  {#if label}
      <div class="absolute inset-0 flex items-center justify-center flex-col text-center">
          {#if typeof label === 'string'}
              <span class="text-xs text-gray-500">{label}</span>
          {:else}
              {@render label()}
          {/if}
      </div>
  {/if}
</div>
