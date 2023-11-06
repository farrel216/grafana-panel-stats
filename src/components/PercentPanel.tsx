import React, { PropsWithChildren } from 'react';
import { PanelProps, getValueFormat, formattedValueToString, ThemeVisualizationColors } from '@grafana/data';
import { PercentPanelOptions } from 'types';
import { css, cx } from '@emotion/css';
import { useStyles2, useTheme2 } from '@grafana/ui';

interface Props extends PanelProps<PercentPanelOptions> {}

const BASE_FONT_SIZE = 38;

function SpanValue({
  className,
  fontSize,
  color,
  lineHeight,
  children,
}: PropsWithChildren<{ className: string; fontSize: string; color?: string; lineHeight?: string }>) {
  return (
    <span
      className={className}
      style={{ fontSize: fontSize, color: color, lineHeight: lineHeight, whiteSpace: 'nowrap' }}
    >
      {children}
    </span>
  );
}

interface TrendDisplay {
  percent: number;
  prefix: string;
  suffix: string;
  color?: string;
  percentFormatted: string;
  percentageValueFormatted: string;
}

function prepareTrendDisplay(
  options: PercentPanelOptions,
  colors: ThemeVisualizationColors,
  baseValueSum: number,
  percentageValueSum: number
): TrendDisplay {
  const stagnationTrendColor = colors.getColorByName('grey');

  const percentageValueFormat = getValueFormat(options.unit)(
    percentageValueSum,
    options.percentageValueDecimals,
    undefined,
    undefined
  );
  const percentageValueFormatted = formattedValueToString(percentageValueFormat);

  if (baseValueSum === 0.0) {
    return {
      percent: NaN,
      prefix: '',
      suffix: '',
      percentFormatted: 'N/A',
      percentageValueFormatted,
      color: stagnationTrendColor,
    };
  }

  const percent = options.interpretAsTrend
    ? ((percentageValueSum - baseValueSum) * 100) / baseValueSum
    : (percentageValueSum * 100) / baseValueSum;
  const percentFormatted =
    options.percentageNrDecimals !== -1 ? percent.toFixed(options.percentageNrDecimals) : percent.toString();

  // Avoid irritation for small numbers being cut off
  const stagnation = parseFloat(percentFormatted) === 0.0;

  const positiveTrendColor = (options.positiveIsGood === undefined ? true : options.positiveIsGood)
    ? colors.getColorByName('green')
    : colors.getColorByName('red');

  const negativeTrendColor = (options.positiveIsGood === undefined ? true : options.positiveIsGood)
    ? colors.getColorByName('red')
    : colors.getColorByName('green');

  const suffix = options.interpretAsTrend ? (stagnation ? ' \u25B6' : percent > 0 ? ' \u25B2' : ' \u25BC') : '';
  const prefix = !stagnation && percent > 0 ? '+' : '';

  return {
    percent,
    prefix,
    suffix,
    color: stagnation ? stagnationTrendColor : percent > 0 ? positiveTrendColor : negativeTrendColor,
    percentFormatted: percentFormatted + '%',
    percentageValueFormatted,
  };
}

export const PercentPanel: React.FC<Props> = ({ options, data, width, height }) => {
  const styles = useStyles2(getPanelStyles);
  const theme = useTheme2();

  const percentageValueFontSize = options.percentageValueFontSize.includes('px')
    ? options.percentageValueFontSize
    : (parseInt(options.percentageValueFontSize, 10) / 100) * BASE_FONT_SIZE + 'px';

  // Get values for calculating percentage
  const percentageValueSerie = data.series.find((serie) =>
    serie.fields.find((field) => field.name === options.percentageValueField)
  );
  const baseValueSerie = data.series.find((serie) =>
    serie.fields.find((field) => field.name === options.baseValueField)
  );

  if (!percentageValueSerie || !baseValueSerie) {
    return <p>Selected series are not available</p>;
  }

  const percentageValueField = percentageValueSerie.fields.find((field) => field.name === options.percentageValueField);
  const baseValueField = baseValueSerie.fields.find((field) => field.name === options.baseValueField);

  if (!percentageValueField || !baseValueField) {
    return <p>Selected fields are not available</p>;
  }
  if (percentageValueField.values.length === 0 || baseValueField.values.length === 0) {
    return <p>Selected fields are empty</p>;
  }

  const percentageValueSum = percentageValueField.values.toArray().reduce((sum, current) => sum + current, 0);
  const baseValueSum = baseValueField.values.toArray().reduce((sum, current) => sum + current, 0);

  const display = prepareTrendDisplay(options, theme.visualization, baseValueSum, percentageValueSum);

  return (
    <div
      className={cx(
        styles.wrapper,
        css`
          width: ${width}px;
          height: ${height}px;
          background-color: rgba(152, 183, 199, 0.3);
          padding: 10px;
          display: flex;
          justify-content: space-between;
        `
      )}
    >
      <div className={styles.panel}>
        <div className={styles.header}>
          <span className={styles.headerTitle}>{options.title}</span>
        </div>
        <div className={styles.content}>
          <span className={styles.contentValue}>328.216</span>
          <p className={styles.contentPercentage}>
            <span>+5533</span> dari tahun lalu
          </p>
        </div>
      </div>
      {/* <div className={styles.boxTitle}>
        <div className={styles.boxLogo}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="14" cy="14" r="14" fill="#31708F" />
            <g clipPath="url(#clip0_825_2116)">
              <path
                d="M13.9998 16C9.2638 16 6.7998 18.8 6.7998 20.4V21.2H21.1998V20.4C21.1998 18.8 18.7358 16 13.9998 16Z"
                fill="white"
              />
              <path
                d="M14 14.8008C16.2091 14.8008 18 13.0099 18 10.8008C18 8.59164 16.2091 6.80078 14 6.80078C11.7909 6.80078 10 8.59164 10 10.8008C10 13.0099 11.7909 14.8008 14 14.8008Z"
                fill="white"
              />
            </g>
            <defs>
              <clipPath id="clip0_825_2116">
                <rect width="16" height="16" fill="white" transform="translate(6 6)" />
              </clipPath>
            </defs>
          </svg>
        </div>
        <div className={styles.labelTitle}>{options.title}</div>
      </div>
      <div className={styles.boxContent}>
        <div className={styles.contentValue}>
          <SpanValue className="percenttrend-panel-base" fontSize={percentageValueFontSize} lineHeight="1em">
            {display.percentageValueFormatted}
          </SpanValue>
        </div>
        <div className={styles.percentage}>
          <SpanValue className="percenttrend-panel-percent" color={display.color} fontSize={options.baseValueFontSize}>
            {display.suffix}
            {display.prefix}
            {display.percentFormatted}
          </SpanValue>
          <SpanValue className="percenttrend-panel-ref" fontSize={options.referenceTextFontSize}>
            {options.referenceText}
          </SpanValue>
        </div>
      </div> */}
    </div>
  );
};

function getPanelStyles() {
  return {
    wrapper: css`
      position: relative;
    `,
    svg: css`
      position: absolute;
      top: 0;
      left: 0;
    `,
    panel: css`
      width: 100%;
      padding: 20px;
    `,
    header: css`
      display: flex;
      align-items: center;
    `,
    headerTitle: css`
      margin-left: 10px;
    `,
    content: css`
      margin: 10px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `,
    contentPercentage: css``,
    boxTitle: css`
      position: relative;
      display: flex;
      align-items: center;
    `,
    labelTitle: css`
      margin-left: 5px;
      font-weight: 700;
      font-size: 20px;
    `,
    boxContent: css`
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
    `,
    boxLogo: css``,
    contentValue: css`
      font-weight: 800;
      font-size: 48px;
      font-style: normal;
      text-align: start;
    `,
    percentage: css`
      font-style: normal;
      font-weight: 600;
      text-align: end;
    `,
  };
}
