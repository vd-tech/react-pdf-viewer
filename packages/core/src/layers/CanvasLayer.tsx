/**
 * A React component to view a PDF document
 *
 * @see https://react-pdf-viewer.dev
 * @license https://react-pdf-viewer.dev/license
 * @copyright 2019-2021 Nguyen Huu Phuoc <me@phuoc.ng>
 */

import * as React from 'react';

import ThemeContext from '../theme/ThemeContext';
import LayerRenderStatus from '../types/LayerRenderStatus';
import { Plugin } from '../types/Plugin';
import PdfJs from '../vendors/PdfJs';
import WithScale from './WithScale';

interface CanvasLayerProps {
    height: number;
    page: PdfJs.Page;
    pageIndex: number;
    plugins: Plugin[];
    rotation: number;
    scale: number;
    width: number;
}

const CanvasLayer: React.FC<CanvasLayerProps> = ({ height, page, pageIndex, plugins, rotation, scale, width }) => {
    const theme = React.useContext(ThemeContext);
    const canvasRef = React.createRef<HTMLCanvasElement>();
    const renderTask = React.useRef<PdfJs.PageRenderTask>();

    // Support high DPI screen
    const devicePixelRatio = window.devicePixelRatio || 1;

    const renderCanvas = (): void => {
        const task = renderTask.current;
        if (task) {
            task.cancel();
        }

        const canvasEle = canvasRef.current as HTMLCanvasElement;

        plugins.forEach(plugin => {
            if (plugin.onCanvasLayerRender) {
                plugin.onCanvasLayerRender({
                    ele: canvasEle,
                    pageIndex,
                    rotation,
                    scale,
                    status: LayerRenderStatus.PreRender,
                });
            }
        });

        // Set the size for canvas here instead of inside `render`
        // to avoid the black flickering
        canvasEle.height = height * devicePixelRatio;
        canvasEle.width = width * devicePixelRatio;
        canvasEle.style.opacity = '0';

        const canvasContext = canvasEle.getContext('2d', { alpha: false }) as CanvasRenderingContext2D;

        const viewport = page.getViewport({ rotation, scale: scale * devicePixelRatio });
        renderTask.current = page.render({ canvasContext, viewport });
        renderTask.current.promise.then(
            (): void => {
                canvasEle.style.removeProperty('opacity');
                plugins.forEach(plugin => {
                    if (plugin.onCanvasLayerRender) {
                        plugin.onCanvasLayerRender({
                            ele: canvasEle,
                            pageIndex,
                            rotation,
                            scale,
                            status: LayerRenderStatus.DidRender,
                        });
                    }
                });
            },
            (): void => {/**/},
        );
    };

    return (
        <WithScale callback={renderCanvas} rotation={rotation} scale={scale}>
            <div
                className={`${theme.prefixClass}-canvas-layer`}
                style={{
                    height: `${height}px`,
                    width: `${width}px`,
                }}
            >
            <canvas
                ref={canvasRef}
                style={{
                    transform: `scale(${1 / devicePixelRatio})`,
                    transformOrigin: `top left`,
                }}
            />
            </div>
        </WithScale>
    );
};

export default CanvasLayer;
