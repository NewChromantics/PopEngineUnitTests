(module
 (table 0 anyfunc)
 (memory $0 1)
 (export "memory" (memory $0))
 (export "Range" (func $Range))
 (export "Depth16ToYuv" (func $Depth16ToYuv))
 (func $Range (; 0 ;) (param $0 f32) (param $1 f32) (param $2 f32) (result f32)
  (f32.div
   (f32.sub
    (get_local $2)
    (get_local $0)
   )
   (f32.sub
    (get_local $1)
    (get_local $0)
   )
  )
 )
 (func $Depth16ToYuv (; 1 ;) (param $0 i32) (param $1 i32) (param $2 i32) (param $3 i32) (param $4 i32) (param $5 i32)
  (local $6 f32)
  (local $7 f32)
  (local $8 i32)
  (set_local $8
   (i32.div_s
    (get_local $2)
    (i32.const 2)
   )
  )
  (block $label$0
   (br_if $label$0
    (i32.lt_s
     (tee_local $3
      (i32.mul
       (get_local $3)
       (get_local $2)
      )
     )
     (i32.const 1)
    )
   )
   (set_local $7
    (f32.sub
     (f32.convert_s/i32
      (get_local $5)
     )
     (tee_local $6
      (f32.convert_s/i32
       (get_local $4)
      )
     )
    )
   )
   (set_local $4
    (i32.add
     (get_local $3)
     (i32.mul
      (get_local $8)
      (get_local $8)
     )
    )
   )
   (set_local $2
    (i32.const 0)
   )
   (loop $label$1
    (i32.store8
     (i32.add
      (get_local $1)
      (get_local $2)
     )
     (i32.trunc_s/f32
      (f32.mul
       (f32.div
        (f32.sub
         (f32.convert_u/i32
          (i32.load16_u
           (get_local $0)
          )
         )
         (get_local $6)
        )
        (get_local $7)
       )
       (f32.const 255)
      )
     )
    )
    (i32.store8
     (i32.add
      (get_local $1)
      (i32.add
       (tee_local $8
        (i32.div_s
         (get_local $2)
         (i32.const 4)
        )
       )
       (get_local $3)
      )
     )
     (i32.const 0)
    )
    (i32.store8
     (i32.add
      (get_local $1)
      (i32.add
       (get_local $4)
       (get_local $8)
      )
     )
     (i32.const 255)
    )
    (set_local $0
     (i32.add
      (get_local $0)
      (i32.const 2)
     )
    )
    (br_if $label$1
     (i32.ne
      (get_local $3)
      (tee_local $2
       (i32.add
        (get_local $2)
        (i32.const 1)
       )
      )
     )
    )
   )
  )
 )
)
