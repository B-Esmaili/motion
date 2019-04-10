import * as React from "react"
import { useContext, forwardRef, Ref, ComponentType } from "react"
import { useExternalRef } from "./utils/use-external-ref"
import { useMotionValues, MountMotionValues } from "./utils/use-motion-values"
import { useMotionStyles } from "./utils/use-styles"
import { useComponentAnimationControls } from "../animation/use-animation-controls"
import { MotionContext, useMotionContext } from "./context/MotionContext"
import { MotionProps } from "./types"
import {
    isGesturesEnabled,
    isDragEnabled,
    Gestures,
    Draggable,
    RenderComponent,
    getAnimateComponent,
    checkShouldInheritVariant,
} from "./utils/functionality"

/**
 * @internal
 */
export const createMotionComponent = <P extends {}>(
    Component: string | ComponentType<P>
) => {
    function MotionComponent(
        props: P & MotionProps,
        externalRef?: Ref<Element>
    ) {
        const ref = useExternalRef(externalRef)
        const parentContext = useContext(MotionContext)
        const isStatic = parentContext.static || props.static || false
        const values = useMotionValues(props, isStatic)
        const style = useMotionStyles(
            values,
            props.style,
            props.transformValues
        )
        const shouldInheritVariant = checkShouldInheritVariant(props)
        const controls = useComponentAnimationControls(
            values,
            props,
            ref,
            shouldInheritVariant
        )
        const context = useMotionContext(
            parentContext,
            controls,
            isStatic,
            props.initial
        )

        // Add functionality
        const Animate = getAnimateComponent(props, context.static)

        const handleAnimate = Animate && (
            <Animate
                {...props}
                inherit={shouldInheritVariant}
                innerRef={ref}
                values={values}
                controls={controls}
            />
        )

        const handleGestures = !context.static && isGesturesEnabled(props) && (
            <Gestures
                {...props}
                values={values}
                controls={controls}
                innerRef={ref}
            />
        )

        const handleDrag = !context.static && isDragEnabled(props) && (
            <Draggable
                {...props}
                innerRef={ref}
                controls={controls}
                values={values}
            />
        )

        // We use an intermediate component here rather than calling `createElement` directly
        // because we want to resolve the style from our motion values only once every
        // functional component has resolved. Resolving it here would do it before the functional components
        // themselves are executed.
        const handleComponent = (
            <RenderComponent
                base={Component}
                props={props}
                innerRef={ref}
                style={style}
                values={values}
                isStatic={isStatic}
            />
        )

        return (
            <MotionContext.Provider value={context}>
                <MountMotionValues ref={ref} values={values} />
                {handleAnimate}
                {handleGestures}
                {handleDrag}
                {handleComponent}
            </MotionContext.Provider>
        )
    }

    return forwardRef(MotionComponent)
}
